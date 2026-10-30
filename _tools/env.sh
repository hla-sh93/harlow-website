#!/usr/bin/env bash
#
# The local WordPress: start, stop, snapshot, and rebuild from this repository.
#
#   ./_tools/env.sh up              start the stack (http://localhost:8090)
#   ./_tools/env.sh down            stop it; the database is kept
#   ./_tools/env.sh status          what is running, and where
#   ./_tools/env.sh wp <args>       WP-CLI, e.g.  ./_tools/env.sh wp plugin list
#   ./_tools/env.sh save [name]     snapshot the database (before experimenting)
#   ./_tools/env.sh restore <name>  ... and put it back
#   ./_tools/env.sh list            the snapshots there are
#   ./_tools/env.sh rebuild --yes   wipe the database and build the site again from the
#                                   repository: the one that works when a snapshot is lost,
#                                   the volume is gone, or on another machine
#   ./_tools/env.sh phpcs           the WordPress Coding Standards over theme/ (exit 0 = clean)
#   ./_tools/env.sh phpcbf          ... and fix what they can fix
#
# Two safety nets, for different things: snapshots undo an experiment; rebuild proves the
# repository alone makes the site. Snapshots live in _env/snapshots/ and are not committed;
# git tags are the restore points that travel with the project.
#
# The admin login is in .env (not committed; the repository is public). The first rebuild
# writes it with a random password.
#
set -euo pipefail

cd "$(dirname "$0")/.."

SITE_URL="http://localhost:8090"
SITE_TITLE="Harlow Group"
# slug, or slug:version where the site must print what live prints (the forms' markup
# names Contact Form 7's version; the job form's hidden job title is the Dynamic Text
# Extension's): live's versions.
PLUGINS="contact-form-7:6.2.3 contact-form-7-dynamic-text-extension:5.0.7 seo-by-rank-math"

# Git Bash rewrites anything that looks like a Unix path into a Windows one, so
# `/env/plugins/x.zip` would reach the container as `C:/Program Files/Git/env/...`.
wp() {
	MSYS_NO_PATHCONV=1 docker compose --progress quiet --profile tools run --rm -T cli wp "$@"
}

# PHP without PHP on this machine: the WP-CLI image has PHP 8.3, so the coding standards run
# inside it with the repository mounted at /app. The Windows path is passed on purpose:
# given the Unix one, Git Bash rewrites the mount.
php_here() {
	MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W 2>/dev/null || pwd):/app" -w /app \
		--entrypoint sh wordpress:cli -c "$*"
}

# vendor/ is not committed, so the first run installs it, with a composer.phar the host
# fetches and checks against its published checksum (no new image to pull).
ensure_standards() {
	[ -f vendor/bin/phpcs ] && return
	mkdir -p _env
	if [ ! -f _env/composer.phar ]; then
		echo "fetching composer.phar from getcomposer.org"
		curl -sSfL -o _env/composer.phar https://getcomposer.org/download/latest-stable/composer.phar
		curl -sSfL -o _env/composer.phar.sha256 https://getcomposer.org/download/latest-stable/composer.phar.sha256
		if [ "$(cut -d' ' -f1 _env/composer.phar.sha256)" != "$(sha256sum _env/composer.phar | cut -d' ' -f1)" ]; then
			echo "composer.phar does not match its published checksum; not using it" >&2
			rm -f _env/composer.phar
			exit 1
		fi
	fi
	php_here 'php /app/_env/composer.phar install --no-interaction --no-progress --quiet'
}

usage() {
	sed -n '3,24p' "$0" | sed 's/^# \{0,1\}//'
	exit 1
}

require_stack() {
	if ! docker compose ps --status running --services 2>/dev/null | grep -q '^wordpress$'; then
		echo "The stack is not running. Start it with: ./_tools/env.sh up" >&2
		exit 1
	fi
}

wait_for_db() {
	printf 'waiting for the database'
	for _ in $(seq 1 60); do
		if docker compose ps --format '{{.Service}} {{.Status}}' | grep -q '^db .*healthy'; then
			echo " ready"
			return
		fi
		printf '.'
		sleep 2
	done
	echo " not ready after two minutes" >&2
	exit 1
}

# The WordPress container copies the core files and writes wp-config.php on its first
# start; WP-CLI can do nothing before that.
wait_for_core() {
	printf 'waiting for WordPress'
	for _ in $(seq 1 60); do
		if wp core version >/dev/null 2>&1; then
			echo " ready"
			return
		fi
		printf '.'
		sleep 2
	done
	echo " not ready after two minutes" >&2
	exit 1
}

admin_login() {
	if [ ! -f .env ]; then
		local pass
		pass="$(python -c 'import secrets; print(secrets.token_urlsafe(18))')"
		printf 'WP_ADMIN_USER=admin\nWP_ADMIN_PASSWORD=%s\nWP_ADMIN_EMAIL=dev@localhost.test\n' "$pass" > .env
		echo "wrote .env with a new admin password (local only, not committed)"
	fi
	# shellcheck disable=SC1091
	. ./.env
}

case "${1:-}" in

up)
	docker compose up -d
	echo "WordPress  $SITE_URL     phpMyAdmin  http://localhost:8091     Mailpit  http://localhost:8035"
	;;

down)
	docker compose down
	;;

status)
	docker compose ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'
	;;

wp)
	require_stack
	shift
	wp "$@"
	;;

save)
	require_stack
	name="${2:-$(date +%Y%m%d-%H%M%S)}"
	mkdir -p _env/snapshots
	wp db export "/env/snapshots/${name}.sql" --add-drop-table >/dev/null
	printf 'saved  %s  (%s)\n' "$name" "$(du -h "_env/snapshots/${name}.sql" | cut -f1)"
	;;

restore)
	require_stack
	name="${2:-}"
	[ -n "$name" ] || { echo "which snapshot? try: $0 list" >&2; exit 1; }
	[ -f "_env/snapshots/${name}.sql" ] || { echo "no snapshot called '$name' in _env/snapshots" >&2; exit 1; }
	wp db import "/env/snapshots/${name}.sql" >/dev/null
	wp cache flush >/dev/null 2>&1 || true
	echo "restored  $name"
	;;

list)
	if [ -d _env/snapshots ] && [ -n "$(ls -A _env/snapshots 2>/dev/null)" ]; then
		ls -lh _env/snapshots | awk 'NR>1 { printf "  %-34s %6s  %s %s %s\n", $9, $5, $6, $7, $8 }'
	else
		echo "  (no snapshots yet)"
	fi
	;;

rebuild)
	if [ "${2:-}" != "--yes" ]; then
		echo "This deletes the local database and builds it again from the repository."
		printf 'Type "yes" to continue: '
		read -r answer
		[ "$answer" = "yes" ] || { echo "nothing done"; exit 1; }
	fi
	admin_login

	docker compose down -v
	docker compose up -d
	wait_for_db
	wait_for_core

	wp core install \
		--url="$SITE_URL" \
		--title="$SITE_TITLE" \
		--admin_user="$WP_ADMIN_USER" \
		--admin_password="$WP_ADMIN_PASSWORD" \
		--admin_email="$WP_ADMIN_EMAIL" \
		--skip-email
	wp theme activate harlow

	# The forms are Contact Form 7 (with its Dynamic Text Extension) and what each page
	# tells a search engine is Rank Math's to print, as on the live site. Turnstile needs the
	# live site's keys and comes in at the live step. The zips are fetched by the host: a
	# container cannot always reach downloads.wordpress.org over TLS.
	mkdir -p _env/plugins
	for entry in $PLUGINS; do
		slug="${entry%%:*}"
		version="latest-stable"
		[ "$entry" != "$slug" ] && version="${entry#*:}"
		curl -sSfL -o "_env/plugins/${slug}.zip" "https://downloads.wordpress.org/plugin/${slug}.${version}.zip"
		wp plugin install "/env/plugins/${slug}.zip" --activate --force >/dev/null
		echo "plugin  $slug  $(wp plugin get "$slug" --field=version)"
	done
	# Rank Math prints nothing on any page until its first screen has been answered: an
	# account connected, or "Skip" pressed. This is the option that Skip sets.
	wp option update rank_math_registration_skip 1 >/dev/null
	# Rank Math opens every link to another site in a new tab by default, which would put a
	# target on links the design prints plain.
	wp eval '$general = (array) get_option( "rank-math-options-general" ); $general["new_window_external_links"] = "off"; update_option( "rank-math-options-general", $general );'
	# Rank Math's Instant Indexing sends every saved page's address to api.indexnow.org,
	# from a local site too. Off here; the live site's own setting is its owner's.
	wp eval 'update_option( "rank_math_modules", array_values( array_diff( (array) get_option( "rank_math_modules" ), array( "instant-indexing" ) ) ) );'

	wp rewrite structure '/%postname%/' >/dev/null
	wp rewrite flush >/dev/null
	wp option update timezone_string 'Asia/Baghdad' >/dev/null

	# WordPress's own sample content is not Harlow's. (Its draft Privacy Policy page stays:
	# the theme's installer adopts it as the site's privacy page, at live's address.)
	wp post delete 1 --force >/dev/null 2>&1 || true
	wp eval '$sample = get_page_by_path( "sample-page" ); if ( $sample ) { wp_delete_post( $sample->ID, true ); }'

	# The site's pages and menus, from the theme's data file (theme/install/site.json).
	wp harlow install

	echo
	echo "Built. WordPress $(wp core version) at $SITE_URL  (login: see .env)"
	echo "Prove it:  python -u _tools/verify_env.py && python -u _tools/verify_chrome.py"
	;;

phpcs)
	ensure_standards
	# A clean run prints nothing, so the result is said in words from the exit code.
	if php_here 'vendor/bin/phpcs'; then
		echo "phpcs: theme/ meets the WordPress Coding Standards (exit 0)"
	else
		code=$?
		echo "phpcs: problems above (exit $code)" >&2
		exit "$code"
	fi
	;;

phpcbf)
	ensure_standards
	php_here 'vendor/bin/phpcbf' || true
	;;

*)
	usage
	;;
esac
