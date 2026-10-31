/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./theme/blocks/accordion-item/edit.js"
/*!*********************************************!*\
  !*** ./theme/blocks/accordion-item/edit.js ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _text_edit__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../text/edit */ "./theme/blocks/text/edit.js");
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);
/**
 * A question in the editor: includes/sections/accordion-item.php. As on the page, the
 * first question is open; selecting another question (or anything in its answer) opens it
 * instead, so every answer can be edited.
 */







function Edit({
  attributes,
  setAttributes,
  context,
  clientId
}) {
  const {
    tab,
    itemId,
    title,
    expanded,
    titleClass,
    contentClass,
    contentStyle
  } = attributes;
  const {
    open,
    index
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => {
    const editor = select(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.store);
    const siblings = editor.getBlockOrder(editor.getBlockRootClientId(clientId));
    const selected = siblings.find(id => editor.isBlockSelected(id) || editor.hasSelectedInnerBlock(id, true));
    return {
      open: selected ? selected === clientId : siblings[0] === clientId,
      index: siblings.indexOf(clientId)
    };
  }, [clientId]);
  // A question added in the editor gets an id of its own for its title and answer.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
    if (!itemId) {
      setAttributes({
        itemId: Date.now() % 1000000000,
        tab: index + 1
      });
    }
  }, [itemId, index, setAttributes]);
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)({
    className: 'elementor-accordion-item'
  });
  const innerBlocksProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useInnerBlocksProps)({
    id: `elementor-tab-content-${itemId}`,
    className: contentClass + (open ? ' elementor-active' : ''),
    'data-tab': tab,
    role: 'region',
    'aria-labelledby': `elementor-tab-title-${itemId}`,
    style: {
      ...(0,_editor_shared__WEBPACK_IMPORTED_MODULE_5__.styleObject)(contentStyle),
      display: open ? 'block' : 'none'
    }
  }, {
    templateLock: false,
    allowedBlocks: _text_edit__WEBPACK_IMPORTED_MODULE_4__.PROSE,
    defaultBlock: {
      name: 'core/paragraph'
    },
    directInsert: true
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
    ...blockProps,
    children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
      id: `elementor-tab-title-${itemId}`,
      className: titleClass + (open ? ' elementor-active' : ''),
      "data-tab": tab,
      role: "button",
      "aria-controls": `elementor-tab-content-${itemId}`,
      "aria-expanded": open ? 'true' : expanded,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("span", {
        className: "elementor-accordion-icon elementor-accordion-icon-left",
        "aria-hidden": "true",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
          className: "elementor-accordion-icon-closed",
          dangerouslySetInnerHTML: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_5__.iconHtml)(context['harlow/iconClosed'] || '', false)
        }), '\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
          className: "elementor-accordion-icon-opened",
          dangerouslySetInnerHTML: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_5__.iconHtml)(context['harlow/iconOpened'] || '', false)
        }), '\n']
      }), '\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.RichText, {
        tagName: "a",
        className: "elementor-accordion-title",
        tabIndex: 0,
        value: title,
        onChange: value => setAttributes({
          title: value
        }),
        placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Question', 'harlow'),
        withoutInteractiveFormatting: true
      }), '\n']
    }), '\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      ...innerBlocksProps
    }), '\n']
  });
}

/***/ },

/***/ "./theme/blocks/accordion/edit.js"
/*!****************************************!*\
  !*** ./theme/blocks/accordion/edit.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/**
 * An accordion in the editor: includes/sections/accordion.php, its questions as blocks
 * (harlow/accordion-item); the open and closed icons in the sidebar.
 */





function Edit({
  attributes,
  setAttributes
}) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.elementProps)(attributes, 'widget', 'accordion.default'));
  const innerBlocksProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useInnerBlocksProps)({
    className: 'elementor-accordion'
  }, {
    templateLock: false,
    allowedBlocks: ['harlow/accordion-item'],
    defaultBlock: {
      name: 'harlow/accordion-item'
    },
    directInsert: true
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Icon of a closed question', 'harlow'),
        initialOpen: false,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_3__.IconPicker, {
          value: attributes.iconClosed,
          onChange: iconClosed => setAttributes({
            iconClosed
          })
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Icon of an open question', 'harlow'),
        initialOpen: false,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_3__.IconPicker, {
          value: attributes.iconOpened,
          onChange: iconOpened => setAttributes({
            iconOpened
          })
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      ...blockProps,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "elementor-widget-container",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
          ...innerBlocksProps
        }), '\n']
      }), '\n']
    })]
  });
}

/***/ },

/***/ "./theme/blocks/box/edit.js"
/*!**********************************!*\
  !*** ./theme/blocks/box/edit.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _text_edit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../text/edit */ "./theme/blocks/text/edit.js");
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);
/**
 * A box in the editor: includes/sections/box.php, the paragraphs inside it as blocks.
 */




function Edit({
  attributes
}) {
  const Tag = attributes.tag === 'section' ? 'section' : 'div';
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_2__.attributeProps)(attributes.htmlAttributes));
  const innerBlocksProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useInnerBlocksProps)(blockProps, {
    templateLock: false,
    allowedBlocks: _text_edit__WEBPACK_IMPORTED_MODULE_1__.PROSE,
    defaultBlock: {
      name: 'core/paragraph'
    },
    directInsert: true
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(Tag, {
    ...innerBlocksProps
  });
}

/***/ },

/***/ "./theme/blocks/button/edit.js"
/*!*************************************!*\
  !*** ./theme/blocks/button/edit.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/**
 * A button in the editor: includes/sections/button.php, its words typed in place, its link
 * and icon in the sidebar.
 */





function Edit({
  attributes,
  setAttributes
}) {
  const {
    text,
    hasIcon,
    icon,
    iconAfter,
    buttonClass,
    link,
    linkTarget,
    linkRel,
    linkId
  } = attributes;
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.elementProps)(attributes, 'widget', 'button.default'));
  const words = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.RichText, {
    tagName: "span",
    className: "elementor-button-text",
    value: text,
    onChange: value => setAttributes({
      text: value
    }),
    placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Button', 'harlow'),
    withoutInteractiveFormatting: true
  }, "text");
  const parts = [words];
  if (hasIcon) {
    const iconPart = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("span", {
      className: "elementor-button-icon",
      dangerouslySetInnerHTML: {
        __html: '\n' + (icon ? icon + '\n' : '')
      }
    }, "icon");
    if (iconAfter) {
      parts.push(iconPart);
    } else {
      parts.unshift(iconPart);
    }
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Link', 'harlow'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_3__.LinkFields, {
          value: attributes,
          onChange: setAttributes
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Icon', 'harlow'),
        initialOpen: false,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_3__.IconPicker, {
          allowNone: true,
          value: hasIcon ? icon : '',
          onChange: value => setAttributes({
            icon: value,
            hasIcon: !!value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ToggleControl, {
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Icon after the words', 'harlow'),
          checked: iconAfter,
          onChange: value => setAttributes({
            iconAfter: value
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      ...blockProps,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "elementor-widget-container",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
          className: "elementor-button-wrapper",
          children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("a", {
            className: buttonClass,
            href: link ? (0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.linkUrl)(link) : undefined,
            target: link && linkTarget ? linkTarget : undefined,
            rel: link && linkRel ? linkRel : undefined,
            id: linkId || undefined,
            onClick: event => event.preventDefault(),
            children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("span", {
              className: "elementor-button-content-wrapper",
              children: ['\n', parts.flatMap((part, i) => i ? ['\n', part] : [part]), '\n']
            }), '\n']
          }), '\n']
        }), '\n']
      }), '\n']
    })]
  });
}

/***/ },

/***/ "./theme/blocks/container/edit.js"
/*!****************************************!*\
  !*** ./theme/blocks/container/edit.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);
/**
 * A container in the editor: the same box as includes/sections/container.php, with the
 * blocks inside it (in its inner box when it is boxed). A background video is sized as
 * assets/js/background-video.js sizes it on the page.
 */




const RATIO = 16 / 9;

/**
 * Cover the video's box at 16:9 in pixels, and again when the box changes size.
 *
 * @param {Object} box The video's box (a ref).
 * @param {string} src The video, so a new one is sized too.
 */
function useCoverVideo(box, src) {
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useLayoutEffect)(() => {
    const el = box.current;
    if (!el) {
      return;
    }
    const videoEl = el.querySelector('video');
    const size = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!h) {
        return;
      }
      const widthFixed = w / h > RATIO;
      videoEl.style.width = `${widthFixed ? w : h * RATIO}px`;
      videoEl.style.height = `${widthFixed ? w / RATIO : h}px`;
    };
    size();
    const observer = new el.ownerDocument.defaultView.ResizeObserver(size);
    observer.observe(el);
    return () => observer.disconnect();
  }, [box, src]);
}
function Edit({
  attributes
}) {
  const {
    boxed,
    video
  } = attributes;
  const videoBox = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)();
  useCoverVideo(videoBox, video);
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_2__.elementProps)(attributes, 'container'));
  const innerBlocksProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useInnerBlocksProps)(boxed ? {
    className: 'e-con-inner'
  } : blockProps, {
    templateLock: false,
    allowedBlocks: _editor_shared__WEBPACK_IMPORTED_MODULE_2__.IN_CONTAINER
  });
  const backgroundVideo = video && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
    children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "elementor-background-video-container",
      ref: videoBox,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("video", {
        className: "elementor-background-video-hosted"
        // The page's video, as Elementor marks it up: decoration only.
        // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
        ,
        role: "presentation",
        autoPlay: true,
        muted: true,
        playsInline: true,
        loop: true,
        src: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_2__.linkUrl)(video)
      }), '\n']
    })]
  });
  if (boxed) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      ...blockProps,
      children: [backgroundVideo, '\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
        ...innerBlocksProps
      }), '\n']
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    ...innerBlocksProps,
    children: [backgroundVideo, innerBlocksProps.children]
  });
}

/***/ },

/***/ "./theme/blocks/divider/edit.js"
/*!**************************************!*\
  !*** ./theme/blocks/divider/edit.js ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * A divider in the editor: includes/sections/divider.php.
 */



function Edit({
  attributes
}) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_1__.elementProps)(attributes, 'widget', 'divider.default'));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    ...blockProps,
    children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "elementor-widget-container",
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "elementor-divider",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
          className: "elementor-divider-separator",
          children: '\n'
        }), '\n']
      }), '\n']
    }), '\n']
  });
}

/***/ },

/***/ "./theme/blocks/document/edit.js"
/*!***************************************!*\
  !*** ./theme/blocks/document/edit.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * The page's Elementor document in the editor: the element its sections are in, which the
 * page's own design rules are keyed on (includes/sections/document.php).
 */



function Edit({
  attributes,
  clientId
}) {
  const {
    docType,
    docId,
    postType
  } = attributes;
  const {
    postId,
    empty
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => ({
    postId: select('core/editor')?.getCurrentPostId(),
    empty: !select(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.store).getBlockCount(clientId)
  }), [clientId]);
  const id = docId || postId;
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)({
    'data-elementor-type': docType,
    'data-elementor-id': id,
    className: `elementor elementor-${id}`,
    'data-elementor-post-type': postType
  });
  // A new page's document starts empty, with a button to add its first section.
  const innerBlocksProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useInnerBlocksProps)(blockProps, {
    templateLock: false,
    allowedBlocks: ['harlow/container'],
    renderAppender: empty ? _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InnerBlocks.ButtonBlockAppender : false
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
    ...innerBlocksProps
  });
}

/***/ },

/***/ "./theme/blocks/gallery/edit.js"
/*!**************************************!*\
  !*** ./theme/blocks/gallery/edit.js ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);
/**
 * A gallery in the editor: the server's markup of includes/sections/gallery.php (its
 * pictures are the block's own or the item's gallery field, chosen in the item's screen).
 */


function Edit({
  attributes
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_0__.ServerMarkup, {
    name: "harlow/gallery",
    attributes: attributes
  });
}

/***/ },

/***/ "./theme/blocks/heading/edit.js"
/*!**************************************!*\
  !*** ./theme/blocks/heading/edit.js ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/**
 * A heading in the editor: includes/sections/heading.php, its words typed in place.
 */





const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span'];
function Edit({
  attributes,
  setAttributes
}) {
  const {
    tag,
    size,
    text
  } = attributes;
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.elementProps)(attributes, 'widget', 'heading.default'));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Heading', 'harlow'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Element', 'harlow'),
          value: tag,
          options: TAGS.map(t => ({
            value: t,
            label: t
          })),
          onChange: value => setAttributes({
            tag: value
          })
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      ...blockProps,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "elementor-widget-container",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.RichText, {
          tagName: TAGS.includes(tag) ? tag : 'h2',
          className: `elementor-heading-title elementor-size-${size}`,
          value: text,
          onChange: value => setAttributes({
            text: value
          }),
          placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Heading', 'harlow')
        }), '\n']
      }), '\n']
    })]
  });
}

/***/ },

/***/ "./theme/blocks/html/edit.js"
/*!***********************************!*\
  !*** ./theme/blocks/html/edit.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MarkupPanel: () => (/* binding */ MarkupPanel),
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/**
 * An HTML widget in the editor: includes/sections/html.php, its markup shown as the page
 * shows it and written in the sidebar.
 */





/**
 * The sidebar field of a block whose content is markup.
 *
 * @param {Object}   props
 * @param {string}   props.value    The markup.
 * @param {Function} props.onChange Called with the new markup.
 */

function MarkupPanel({
  value,
  onChange
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('HTML', 'harlow'),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextareaControl, {
        __nextHasNoMarginBottom: true,
        className: "harlow-code",
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Markup', 'harlow'),
        rows: 14,
        value: value,
        onChange: onChange
      })
    })
  });
}
function Edit({
  attributes,
  setAttributes
}) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.elementProps)(attributes, 'widget', 'html.default'));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(MarkupPanel, {
      value: attributes.html,
      onChange: html => setAttributes({
        html
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      ...blockProps,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
        className: "elementor-widget-container",
        dangerouslySetInnerHTML: {
          __html: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.resolveLinks)(attributes.html)
        }
      }), '\n']
    })]
  });
}

/***/ },

/***/ "./theme/blocks/icon-list/edit.js"
/*!****************************************!*\
  !*** ./theme/blocks/icon-list/edit.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _editor_items__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/items */ "./theme/editor/items.js");
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);
/**
 * An icon list in the editor: includes/sections/icon-list.php, each line's words typed in
 * place, its link and icon in the sidebar.
 */






function Edit({
  attributes,
  setAttributes
}) {
  const {
    inline,
    items
  } = attributes;
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_4__.elementProps)(attributes, 'widget', 'icon-list.default'));
  const setItems = next => setAttributes({
    items: next
  });
  const update = (index, patch) => setItems(items.map((item, i) => i === index ? {
    ...item,
    ...patch
  } : item));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_editor_items__WEBPACK_IMPORTED_MODULE_3__["default"], {
      items: items,
      onChange: setItems,
      blank: {
        text: ''
      },
      children: (item, change) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_4__.LinkFields, {
          value: item,
          onChange: change
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_4__.IconPicker, {
          allowNone: true,
          value: item.icon || '',
          onChange: icon => change({
            icon
          })
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
      ...blockProps,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
        className: "elementor-widget-container",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("ul", {
          className: 'elementor-icon-list-items' + (inline ? ' elementor-inline-items' : ''),
          children: [items.map((item, index) => {
            const parts = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
              children: [item.icon && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("span", {
                  className: "elementor-icon-list-icon",
                  dangerouslySetInnerHTML: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_4__.iconHtml)(item.icon)
                }), '\n']
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.RichText, {
                tagName: "span",
                className: "elementor-icon-list-text",
                value: item.text || '',
                onChange: text => update(index, {
                  text
                }),
                placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Line', 'harlow'),
                withoutInteractiveFormatting: true
              })]
            });
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
              children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("li", {
                className: 'elementor-icon-list-item' + (inline ? ' elementor-inline-item' : ''),
                children: ['\n', item.link ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("a", {
                  href: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_4__.linkUrl)(item.link),
                  target: item.linkTarget || undefined,
                  rel: item.linkRel || undefined,
                  onClick: event => event.preventDefault(),
                  children: ['\n\n', parts, '\n']
                }) : parts, '\n']
              })]
            }, index);
          }), '\n']
        }), '\n']
      }), '\n']
    })]
  });
}

/***/ },

/***/ "./theme/blocks/icon/edit.js"
/*!***********************************!*\
  !*** ./theme/blocks/icon/edit.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/**
 * An icon in the editor: includes/sections/icon.php, the icon chosen in the sidebar from
 * the site's set.
 */





function Edit({
  attributes,
  setAttributes
}) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.elementProps)(attributes, 'widget', 'icon.default'));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Icon', 'harlow'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_3__.IconPicker, {
          value: attributes.icon,
          onChange: icon => setAttributes({
            icon
          })
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      ...blockProps,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "elementor-widget-container",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
          className: "elementor-icon-wrapper",
          children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
            className: "elementor-icon",
            dangerouslySetInnerHTML: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.iconHtml)(attributes.icon)
          }), '\n']
        }), '\n']
      }), '\n']
    })]
  });
}

/***/ },

/***/ "./theme/blocks/image/edit.js"
/*!************************************!*\
  !*** ./theme/blocks/image/edit.js ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/core-data */ "@wordpress/core-data");
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);
/**
 * An image in the editor: the server's markup of includes/sections/image.php, so the
 * picture has the page's own srcset and the browser picks the same file. The picture is
 * replaced from the Media Library in the toolbar; its words for screen readers and its
 * link in the sidebar.
 */







function Edit({
  attributes,
  setAttributes
}) {
  const {
    image,
    link,
    alt
  } = attributes;
  const media = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_3__.useSelect)(select => image ? select(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_2__.store).getEntityRecord('postType', 'attachment', image) : null, [image]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.BlockControls, {
      group: "other",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.MediaReplaceFlow, {
        mediaId: image || undefined,
        mediaURL: media?.source_url,
        allowedTypes: ['image'],
        accept: "image/*",
        onSelect: picked => setAttributes({
          image: picked.id,
          alt: picked.alt || '',
          src: '',
          width: '',
          height: '',
          imgClass: ''
        }),
        name: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Replace picture', 'harlow')
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Picture', 'harlow'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextareaControl, {
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Words for screen readers (alt)', 'harlow'),
          value: alt,
          onChange: value => setAttributes({
            alt: value
          })
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Link', 'harlow'),
        initialOpen: !!link,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_5__.LinkFields, {
          value: attributes,
          onChange: setAttributes
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_5__.ServerMarkup, {
      name: "harlow/image",
      attributes: attributes
    })]
  });
}

/***/ },

/***/ "./theme/blocks/loop/edit.js"
/*!***********************************!*\
  !*** ./theme/blocks/loop/edit.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);
/**
 * A list of items in the editor: the server's markup of includes/sections/loop.php (the
 * items are kept in their own screens); which items, how many and in what order in the
 * sidebar. A carousel gets the slide widths assets/js/carousel.js gives it on the page.
 */






const TYPES = [{
  value: 'post',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Posts', 'harlow'),
  card: 'post-card'
}, {
  value: 'news',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('News', 'harlow'),
  card: 'post-card'
}, {
  value: 'albahoo_project',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Projects', 'harlow'),
  card: 'project'
}, {
  value: 'gallery_item',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Gallery', 'harlow'),
  card: 'gallery-item'
}, {
  value: 'job',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Jobs', 'harlow'),
  card: 'job'
}, {
  value: 'business_model',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Business models', 'harlow'),
  card: 'business-model'
}, {
  value: 'harlows_person',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Harlow’s people', 'harlow'),
  card: 'person'
}, {
  value: 'testimonial',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Testimonials', 'harlow'),
  card: 'testimonial'
}, {
  value: 'client_logo',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Client logos', 'harlow'),
  card: 'client-logo'
}];

/**
 * The slide widths of a carousel, as carousel.js sets them on the page before its first
 * move (the loop's copies aside: they sit outside the view).
 *
 * @param {Element} widget The list's element.
 */
function sizeSlides(widget) {
  const container = widget.querySelector('.swiper');
  const slides = container ? [...container.querySelectorAll('.swiper-wrapper > .swiper-slide')] : [];
  if (slides.length < 2) {
    return;
  }
  let s;
  try {
    s = JSON.parse(widget.dataset.settings || '{}');
  } catch {
    return;
  }
  const view = widget.ownerDocument.defaultView;
  let device = 'desktop';
  if (view.matchMedia('(max-width: 767px)').matches) {
    device = 'mobile';
  } else if (view.matchMedia('(max-width: 1024px)').matches) {
    device = 'tablet';
  }
  const show = +s.slides_to_show || 3;
  const offset = s.offset_sides === 'right' || s.offset_sides === 'both';
  const perView = {
    mobile: +s.slides_to_show_mobile || 1,
    tablet: +s.slides_to_show_tablet || (show === 1 ? 1 : 2),
    desktop: show + (offset ? 0.001 : 0)
  }[device];
  const devices = ['desktop', 'tablet', 'mobile'];
  let space = 0;
  for (let i = devices.indexOf(device); i >= 0; i -= 1) {
    const v = s[i === 0 ? 'image_spacing_custom' : `image_spacing_custom_${devices[i]}`];
    const size = v && typeof v === 'object' ? v.size : v;
    if (size !== undefined && size !== '' && size !== null) {
      space = Number(size) || 0;
      break;
    }
  }
  if (s.offset_sides && s.offset_sides !== 'none') {
    container.classList.add(`offset-${s.offset_sides}`);
  }
  container.classList.add('swiper-initialized', 'swiper-horizontal', 'swiper-pointer-events');
  const cs = view.getComputedStyle(container);
  const inner = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const width = (inner - (perView - 1) * space) / perView;
  slides.forEach((el, i) => {
    el.style.width = `${width}px`;
    el.style.marginRight = `${space}px`;
    el.classList.toggle('swiper-slide-active', i === 0);
    el.classList.toggle('swiper-slide-next', i === 1);
  });
}
function Edit({
  attributes,
  setAttributes
}) {
  const {
    postType,
    layout,
    perPage,
    orderby,
    order
  } = attributes;
  const onMarkup = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useCallback)(el => {
    if (el.classList.contains('elementor-widget-loop-carousel')) {
      sizeSlides(el);
    }
  }, []);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Items', 'harlow'),
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Shows', 'harlow'),
          value: postType,
          options: TYPES,
          onChange: value => setAttributes({
            postType: value,
            template: TYPES.find(t => t.value === value).card
          })
        }), !['plain', 'box'].includes(layout) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.RangeControl, {
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('How many', 'harlow'),
          value: perPage,
          min: 1,
          max: 24,
          onChange: value => setAttributes({
            perPage: value
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('In the order of', 'harlow'),
          value: `${orderby} ${order}`,
          options: [{
            value: 'date DESC',
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Newest first', 'harlow')
          }, {
            value: 'date ASC',
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Oldest first', 'harlow')
          }, {
            value: 'menu_order ASC',
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Their order number', 'harlow')
          }],
          onChange: value => {
            const [by, direction] = value.split(' ');
            setAttributes({
              orderby: by,
              order: direction
            });
          }
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_4__.ServerMarkup, {
      name: "harlow/loop",
      attributes: attributes,
      onMarkup: onMarkup
    })]
  });
}

/***/ },

/***/ "./theme/blocks/markup/edit.js"
/*!*************************************!*\
  !*** ./theme/blocks/markup/edit.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _html_edit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../html/edit */ "./theme/blocks/html/edit.js");
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/**
 * One element written as HTML in the editor: the element itself in the canvas, with the
 * block's props on it (core's HTML block shows a preview in a frame of its own, which the
 * page's stylesheets do not reach), and its markup in the sidebar.
 */





const VOID = ['area', 'br', 'col', 'embed', 'hr', 'img', 'input', 'source', 'wbr'];
function Edit({
  attributes,
  setAttributes
}) {
  const root = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    const holder = document.createElement('template');
    holder.innerHTML = (0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.resolveLinks)(attributes.html).trim();
    const el = holder.content.firstElementChild;
    if (!el || holder.content.children.length > 1) {
      return {
        tag: 'div',
        props: {},
        inner: attributes.html
      };
    }
    const attrs = {};
    [...el.attributes].forEach(a => {
      attrs[a.name] = a.value;
    });
    return {
      tag: el.tagName.toLowerCase(),
      props: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_3__.attributeProps)(attrs),
      inner: el.innerHTML
    };
  }, [attributes.html]);
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)(root.props);
  const Tag = root.tag;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_html_edit__WEBPACK_IMPORTED_MODULE_2__.MarkupPanel, {
      value: attributes.html,
      onChange: html => setAttributes({
        html
      })
    }), VOID.includes(Tag) ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(Tag, {
      ...blockProps
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(Tag, {
      ...blockProps,
      dangerouslySetInnerHTML: {
        __html: root.inner
      }
    })]
  });
}

/***/ },

/***/ "./theme/blocks/nav-menu/edit.js"
/*!***************************************!*\
  !*** ./theme/blocks/nav-menu/edit.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/**
 * A menu in the editor: the server's markup of includes/sections/nav-menu.php. Its links
 * are kept in Appearance → Menus; the sidebar chooses which menu it shows.
 */





const MENUS = [{
  value: 'primary',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Main menu', 'harlow')
}, {
  value: 'careers',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Careers menu', 'harlow')
}, {
  value: 'footer-1',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Footer, first column', 'harlow')
}, {
  value: 'footer-2',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Footer, second column', 'harlow')
}, {
  value: 'footer-3',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Footer, third column', 'harlow')
}, {
  value: 'footer-legal',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Footer, legal links', 'harlow')
}];
function Edit({
  attributes,
  setAttributes
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Menu', 'harlow'),
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Shows', 'harlow'),
          value: attributes.menu,
          options: MENUS,
          onChange: menu => setAttributes({
            menu
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ExternalLink, {
            href: "nav-menus.php",
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Edit the menus', 'harlow')
          })
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_3__.ServerMarkup, {
      name: "harlow/nav-menu",
      attributes: attributes
    })]
  });
}

/***/ },

/***/ "./theme/blocks/post-content/edit.js"
/*!*******************************************!*\
  !*** ./theme/blocks/post-content/edit.js ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);
/**
 * The item's text in the editor: the server's markup of includes/sections/post-content.php
 * (the text is the item's own, written in its own screen).
 */


function Edit({
  attributes
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_0__.ServerMarkup, {
    name: "harlow/post-content",
    attributes: attributes
  });
}

/***/ },

/***/ "./theme/blocks/shortcode/edit.js"
/*!****************************************!*\
  !*** ./theme/blocks/shortcode/edit.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _html_edit__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../html/edit */ "./theme/blocks/html/edit.js");
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);
/**
 * A shortcode widget in the editor: includes/sections/shortcode.php. A form is the
 * server's markup (the form is its plugin's, written in Contact → Contact Forms), with the
 * spinner CF7's script adds on the page; its shortcode in the sidebar. Markup a plugin
 * printed on live is shown as the page shows it and written in the sidebar.
 */






/**
 * What CF7's script does to a form on the page: a spinner after the submit button.
 *
 * @param {Element} el The block's element.
 */

function addSpinners(el) {
  el.querySelectorAll('.has-spinner').forEach(button => {
    if (!button.nextElementSibling?.matches('.wpcf7-spinner')) {
      button.insertAdjacentHTML('afterend', '<span class="wpcf7-spinner"></span>');
    }
  });
}
function Shortcode({
  attributes,
  setAttributes
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Form', 'harlow'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextControl, {
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Shortcode', 'harlow'),
          help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Contact → Contact Forms shows each form’s shortcode.', 'harlow'),
          value: attributes.shortcode,
          onChange: shortcode => setAttributes({
            shortcode
          })
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_4__.ServerMarkup, {
      name: "harlow/shortcode",
      attributes: attributes,
      onMarkup: addSpinners
    })]
  });
}
function Markup({
  attributes,
  setAttributes
}) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_4__.elementProps)(attributes, 'widget', 'shortcode.default'));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_html_edit__WEBPACK_IMPORTED_MODULE_3__.MarkupPanel, {
      value: attributes.html,
      onChange: html => setAttributes({
        html
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
      ...blockProps,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
        className: "elementor-widget-container",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("div", {
          className: "elementor-shortcode",
          dangerouslySetInnerHTML: {
            __html: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_4__.resolveLinks)(attributes.html)
          }
        }), '\n']
      }), '\n']
    })]
  });
}
function Edit(props) {
  return props.attributes.shortcode ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(Shortcode, {
    ...props
  }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(Markup, {
    ...props
  });
}

/***/ },

/***/ "./theme/blocks/site-part/edit.js"
/*!****************************************!*\
  !*** ./theme/blocks/site-part/edit.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/**
 * The site's header or footer inside a page (the home page's), as the server prints it:
 * their logo, menus and words are kept in Appearance → Customize and Menus. The header
 * bar follows the canvas's scrolling as assets/js/header.js makes it follow the page's.
 */





/**
 * header.js: past 200px of scroll the bar turns brand blue and the logo shrinks.
 *
 * @param {Element} el The header's element.
 * @return {Function|undefined} Stops following.
 */

function followScroll(el) {
  const header = el.querySelector('#nav-header');
  if (!header) {
    return;
  }
  const view = el.ownerDocument.defaultView;
  const logo = header.querySelector('.logo');
  const brand = view.getComputedStyle(el.ownerDocument.documentElement).getPropertyValue('--hl-color-primary').trim() || '#0165A1';
  const onScroll = () => {
    const past = view.scrollY >= 200;
    header.style.backgroundColor = past ? brand : '#0165A100';
    if (logo) {
      logo.style.width = past ? '125px' : '165px';
    }
  };
  view.addEventListener('scroll', onScroll, {
    passive: true
  });
  return () => view.removeEventListener('scroll', onScroll);
}
function Edit({
  attributes
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
          children: 'footer' === attributes.part ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('The site’s footer, the same on every page.', 'harlow') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('The site’s header, the same on every page.', 'harlow')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.ExternalLink, {
            href: "customize.php",
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Edit it in Appearance → Customize', 'harlow')
          })
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_3__.ServerMarkup, {
      name: "harlow/site-part",
      attributes: attributes,
      onMarkup: followScroll
    })]
  });
}

/***/ },

/***/ "./theme/blocks/social-icons/edit.js"
/*!*******************************************!*\
  !*** ./theme/blocks/social-icons/edit.js ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_escape_html__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/escape-html */ "@wordpress/escape-html");
/* harmony import */ var _wordpress_escape_html__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_escape_html__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _editor_items__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../editor/items */ "./theme/editor/items.js");
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);
/**
 * Social icons in the editor: includes/sections/social-icons.php; each icon's link, name
 * for screen readers and picture in the sidebar.
 */








function Edit({
  attributes,
  setAttributes
}) {
  const {
    items
  } = attributes;
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_6__.elementProps)(attributes, 'widget', 'social-icons.default'));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_editor_items__WEBPACK_IMPORTED_MODULE_5__["default"], {
      items: items,
      onChange: next => setAttributes({
        items: next
      }),
      blank: {
        label: '',
        link: ''
      },
      children: (item, change) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.Fragment, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextControl, {
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Name for screen readers', 'harlow'),
          value: item.label || '',
          onChange: label => change({
            label
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_6__.LinkFields, {
          value: item,
          onChange: change
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_editor_shared__WEBPACK_IMPORTED_MODULE_6__.IconPicker, {
          value: item.icon || '',
          onChange: icon => change({
            icon
          })
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      ...blockProps,
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
        className: "elementor-widget-container",
        children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
          className: "elementor-social-icons-wrapper elementor-grid",
          role: "list",
          children: [items.map((item, index) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.Fragment, {
            children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("span", {
              className: "elementor-grid-item",
              role: "listitem",
              children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("a", {
                className: item.linkClass || undefined,
                href: (0,_editor_shared__WEBPACK_IMPORTED_MODULE_6__.linkUrl)(item.link || ''),
                target: item.linkTarget || undefined,
                rel: item.linkRel || undefined,
                onClick: event => event.preventDefault(),
                dangerouslySetInnerHTML: {
                  __html: '\n<span class="elementor-screen-only">' + (0,_wordpress_escape_html__WEBPACK_IMPORTED_MODULE_3__.escapeHTML)(item.label || '') + '</span>\n' + (item.icon || '') + '\n'
                }
              }), '\n']
            })]
          }, index)), '\n']
        }), '\n']
      }), '\n']
    })]
  });
}

/***/ },

/***/ "./theme/blocks/template/edit.js"
/*!***************************************!*\
  !*** ./theme/blocks/template/edit.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * A saved template in the editor: includes/sections/template.php around its blocks (the
 * major clients section, shared by every page that shows it, or the header or footer).
 */



function Edit({
  attributes
}) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_1__.elementProps)(attributes, 'widget', 'template.default'));
  const innerBlocksProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useInnerBlocksProps)({
    className: 'elementor-template'
  }, {
    templateLock: false,
    allowedBlocks: ['core/block', 'harlow/site-part']
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    ...blockProps,
    children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "elementor-widget-container",
      children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        ...innerBlocksProps,
        children: ['\n', innerBlocksProps.children, '\n']
      }), '\n']
    }), '\n']
  });
}

/***/ },

/***/ "./theme/blocks/text/edit.js"
/*!***********************************!*\
  !*** ./theme/blocks/text/edit.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PROSE: () => (/* binding */ PROSE),
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _editor_shared__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../editor/shared */ "./theme/editor/shared.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * A text in the editor: includes/sections/text.php, its paragraphs and lists as blocks.
 */



const PROSE = ['core/paragraph', 'core/list', 'harlow/box', 'harlow/markup'];
function Edit({
  attributes
}) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useBlockProps)((0,_editor_shared__WEBPACK_IMPORTED_MODULE_1__.elementProps)(attributes, 'widget', 'text-editor.default'));
  const innerBlocksProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.useInnerBlocksProps)({
    className: 'elementor-widget-container'
  }, {
    templateLock: false,
    allowedBlocks: PROSE,
    defaultBlock: {
      name: 'core/paragraph'
    },
    directInsert: true
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    ...blockProps,
    children: ['\n', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      ...innerBlocksProps
    }), '\n']
  });
}

/***/ },

/***/ "./theme/editor/design-classes.js"
/*!****************************************!*\
  !*** ./theme/editor/design-classes.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _design_classes_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./design-classes.json */ "./theme/editor/design-classes.json");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);
/**
 * The design of an element is its classes from the vocabulary (_vocab/vocabulary.md): a
 * field in each block's Advanced panel lists them, suggests the others and takes only
 * those. Elementor's own classes of the element are kept as they are.
 */







const known = new Set(_design_classes_json__WEBPACK_IMPORTED_MODULE_5__);
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__.addFilter)('editor.BlockEdit', 'harlow/design-classes', (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_2__.createHigherOrderComponent)(BlockEdit => props => {
  const {
    name,
    attributes,
    setAttributes,
    isSelected
  } = props;
  if (!isSelected || !name.startsWith('harlow/') || typeof attributes.classes !== 'string') {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(BlockEdit, {
      ...props
    });
  }
  const all = attributes.classes.split(/\s+/).filter(Boolean);
  const design = all.filter(c => c.startsWith('hl-'));
  const own = all.filter(c => !c.startsWith('hl-'));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(BlockEdit, {
      ...props
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
      group: "advanced",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.FormTokenField, {
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Design classes', 'harlow'),
        value: design,
        suggestions: _design_classes_json__WEBPACK_IMPORTED_MODULE_5__,
        maxSuggestions: 40,
        __experimentalValidateInput: value => known.has(value),
        onChange: tokens => setAttributes({
          classes: [...own, ...tokens.map(t => typeof t === 'string' ? t : t.value).filter(t => known.has(t))].join(' ')
        })
      })
    })]
  });
}, 'withDesignClasses'));

/***/ },

/***/ "./theme/editor/items.js"
/*!*******************************!*\
  !*** ./theme/editor/items.js ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ItemPanels)
/* harmony export */ });
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);
/**
 * The sidebar of a block whose lines are a list in its attributes (an icon list, social
 * icons): one panel per line, with buttons to add, move and remove lines.
 */




/**
 * @param {Object}   props
 * @param {Object[]} props.items    The lines.
 * @param {Function} props.onChange Called with the new lines.
 * @param {Object}   props.blank    A new line.
 * @param {Function} props.children Renders the fields of one line: ( item, update ) => fields.
 */

function ItemPanels({
  items,
  onChange,
  blank,
  children
}) {
  const update = (index, patch) => onChange(items.map((item, i) => i === index ? {
    ...item,
    ...patch
  } : item));
  const move = (index, by) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InspectorControls, {
    children: [items.map((item, index) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
      /* translators: %d: the line's number. */
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.sprintf)((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Line %d', 'harlow'), index + 1),
      initialOpen: false,
      children: [children(item, patch => update(index, patch)), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Flex, {
        justify: "flex-start",
        wrap: true,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "secondary",
          size: "small",
          disabled: index === 0,
          onClick: () => move(index, -1),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Move up', 'harlow')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "secondary",
          size: "small",
          disabled: index === items.length - 1,
          onClick: () => move(index, 1),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Move down', 'harlow')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "secondary",
          size: "small",
          isDestructive: true,
          onClick: () => onChange(items.filter((x, i) => i !== index)),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Remove', 'harlow')
        })]
      })]
    }, index)), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelBody, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "secondary",
        onClick: () => onChange([...items, {
          ...(items[items.length - 1] || blank)
        }]),
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Add a line', 'harlow')
      })
    })]
  });
}

/***/ },

/***/ "./theme/editor/page.js"
/*!******************************!*\
  !*** ./theme/editor/page.js ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/core-data */ "@wordpress/core-data");
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_editor__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/editor */ "@wordpress/editor");
/* harmony import */ var _wordpress_editor__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_editor__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _wordpress_plugins__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @wordpress/plugins */ "@wordpress/plugins");
/* harmony import */ var _wordpress_plugins__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_wordpress_plugins__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);
/**
 * What the editor offers for a whole page (functions/kinds.php, functions/page-tools.php):
 * a new page asks what kind of page it is, takes that kind's template and, if wanted, its
 * ready sections (the kind's starter pattern, real words to replace); a page the site was
 * installed with can put its original sections back.
 */










const site = window.harlowEditor || {};

/**
 * "What kind of page is this?": shown once on a new page whose document is still empty.
 */
function KindChooser() {
  const [closed, setClosed] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_6__.useState)(false);
  const [kind, setKind] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_6__.useState)('');
  const [withSections, setWithSections] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_6__.useState)(true);
  const {
    isNew,
    documentId,
    patterns
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_4__.useSelect)(select => {
    const editor = select(_wordpress_editor__WEBPACK_IMPORTED_MODULE_5__.store);
    const blocks = select(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__.store).getBlocks();
    const doc = blocks.length === 1 && blocks[0].name === 'harlow/document' && !blocks[0].innerBlocks.length ? blocks[0] : null;
    return {
      isNew: editor.getCurrentPostType() === 'page' && editor.isEditedPostNew() && !editor.getEditedPostAttribute('template') && !!doc,
      documentId: doc ? doc.clientId : '',
      patterns: select(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_3__.store).getBlockPatterns()
    };
  }, []);
  const {
    editPost
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_4__.useDispatch)(_wordpress_editor__WEBPACK_IMPORTED_MODULE_5__.store);
  const {
    replaceInnerBlocks
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_4__.useDispatch)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__.store);
  const kinds = Object.entries(site.kinds || {});
  if (closed || !isNew || !kinds.length) {
    return null;
  }
  // The starter arrives with the site's patterns, which the editor loads after it opens.
  const starter = kind && (patterns || []).find(p => p.name === site.kinds[kind].starter);
  const start = () => {
    editPost({
      template: `kind-${kind}`
    });
    if (withSections) {
      replaceInnerBlocks(documentId, (0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__.parse)(starter.content));
    }
    setClosed(true);
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Modal, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('What kind of page is this?', 'harlow'),
    className: "harlow-kinds",
    onRequestClose: () => setClosed(true),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('The kind is the page’s template: its look around the sections. You can change it later under Template.', 'harlow')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.RadioControl, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Kind of page', 'harlow'),
      hideLabelFromVision: true,
      selected: kind,
      options: kinds.map(([value, info]) => ({
        value,
        label: info.title,
        description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.sprintf)(/* translators: %s: the title of the page the kind is modelled on. */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Like “%s”', 'harlow'), info.model_title)
      })),
      onChange: setKind
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
      __nextHasNoMarginBottom: true,
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Start with its ready sections (real words to replace)', 'harlow'),
      checked: withSections,
      onChange: setWithSections
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
      className: "harlow-kinds__actions",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
        variant: "tertiary",
        onClick: () => setClosed(true),
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Skip', 'harlow')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
        variant: "primary",
        disabled: !kind || withSections && !starter,
        onClick: start,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Start', 'harlow')
      })]
    })]
  });
}

/**
 * Put the page's original sections back (the page as the site was installed with it).
 */
function OriginalPanel() {
  const [asking, setAsking] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_6__.useState)(false);
  const {
    resetEditorBlocks
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_4__.useDispatch)(_wordpress_editor__WEBPACK_IMPORTED_MODULE_5__.store);
  if (!site.original) {
    return null;
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_editor__WEBPACK_IMPORTED_MODULE_5__.PluginDocumentSettingPanel, {
    name: "harlow-original",
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Original sections', 'harlow'),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('The sections this page had when the site was installed. Nothing is saved until you press Save, and Undo takes it back.', 'harlow')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
      variant: "secondary",
      onClick: () => setAsking(true),
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Put back the original sections', 'harlow')
    }), asking && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Modal, {
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Put back the original sections?', 'harlow'),
      size: "small",
      onRequestClose: () => setAsking(false),
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('The page’s sections are replaced with its original ones.', 'harlow')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
        className: "harlow-kinds__actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          variant: "tertiary",
          onClick: () => setAsking(false),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Cancel', 'harlow')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          variant: "primary",
          onClick: () => {
            resetEditorBlocks((0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__.parse)(site.original));
            setAsking(false);
          },
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__.__)('Put them back', 'harlow')
        })]
      })]
    })]
  });
}
;(0,_wordpress_plugins__WEBPACK_IMPORTED_MODULE_8__.registerPlugin)('harlow-page', {
  render: () => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(KindChooser, {}), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(OriginalPanel, {})]
  })
});

/***/ },

/***/ "./theme/editor/paragraph-data.js"
/*!****************************************!*\
  !*** ./theme/editor/paragraph-data.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * Data attributes on a paragraph: the text of the older pages gives some paragraphs
 * data-animation and data-duration. WordPress's paragraph keeps only its class, so this
 * gives it a field for them (dataAttributes), written on the paragraph when it is saved
 * and shown on it in the canvas. Only data-* names are written.
 */



const DATA = /^data-[a-z0-9_-]+$/;
function dataProps(attributes) {
  const props = {};
  Object.entries(attributes.dataAttributes || {}).forEach(([name, value]) => {
    if (DATA.test(name)) {
      props[name] = value;
    }
  });
  return props;
}
;(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.addFilter)('blocks.registerBlockType', 'harlow/paragraph-data', (settings, name) => name === 'core/paragraph' ? {
  ...settings,
  attributes: {
    ...settings.attributes,
    dataAttributes: {
      type: 'object'
    }
  }
} : settings);
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.addFilter)('blocks.getSaveContent.extraProps', 'harlow/paragraph-data', (props, blockType, attributes) => blockType.name === 'core/paragraph' && attributes.dataAttributes ? {
  ...props,
  ...dataProps(attributes)
} : props);
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.addFilter)('editor.BlockListBlock', 'harlow/paragraph-data', (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_0__.createHigherOrderComponent)(BlockListBlock => props => props.name === 'core/paragraph' && props.attributes.dataAttributes ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(BlockListBlock, {
  ...props,
  wrapperProps: {
    ...props.wrapperProps,
    ...dataProps(props.attributes)
  }
}) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(BlockListBlock, {
  ...props
}), 'withParagraphData'));

/***/ },

/***/ "./theme/editor/shared.js"
/*!********************************!*\
  !*** ./theme/editor/shared.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IN_CONTAINER: () => (/* binding */ IN_CONTAINER),
/* harmony export */   IconPicker: () => (/* binding */ IconPicker),
/* harmony export */   LinkFields: () => (/* binding */ LinkFields),
/* harmony export */   LinkPanel: () => (/* binding */ LinkPanel),
/* harmony export */   ServerMarkup: () => (/* binding */ ServerMarkup),
/* harmony export */   attributeProps: () => (/* binding */ attributeProps),
/* harmony export */   elementProps: () => (/* binding */ elementProps),
/* harmony export */   iconHtml: () => (/* binding */ iconHtml),
/* harmony export */   linkUrl: () => (/* binding */ linkUrl),
/* harmony export */   resolveLinks: () => (/* binding */ resolveLinks),
/* harmony export */   styleObject: () => (/* binding */ styleObject)
/* harmony export */ });
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_url__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/url */ "@wordpress/url");
/* harmony import */ var _wordpress_url__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_url__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _icons_json__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./icons.json */ "./theme/editor/icons.json");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);
/**
 * What the blocks' edit views share: an element's attributes as Elementor writes them,
 * readable links made addresses, the site's icons, the link and picture panels, and the
 * server's markup for the blocks whose words live elsewhere (menus, lists, header, footer).
 */









const site = window.harlowEditor || {
  themeUri: '',
  pages: {}
};

/** What a container holds: containers and Elementor's widgets, not WordPress's own blocks. */
const IN_CONTAINER = ['harlow/container', 'harlow/heading', 'harlow/text', 'harlow/image', 'harlow/button', 'harlow/divider', 'harlow/icon', 'harlow/icon-list', 'harlow/social-icons', 'harlow/accordion', 'harlow/html', 'harlow/shortcode', 'harlow/nav-menu', 'harlow/template', 'harlow/loop', 'harlow/site-part'];

/**
 * The attributes of an element as Elementor writes them (harlow_element_attributes()).
 *
 * @param {Object} attributes The block's attributes.
 * @param {string} kind       'container' or 'widget'.
 * @param {string} widget     The widget type, for a widget.
 * @return {Object} Props for the element.
 */
function elementProps(attributes, kind, widget = '') {
  const props = {
    className: attributes.classes,
    'data-id': attributes.element,
    'data-element_type': kind,
    'data-e-type': kind
  };
  // The editor keeps a block's id for itself; the page's is kept here (editor/canvas.css).
  if (attributes.htmlId) {
    props['data-html-id'] = attributes.htmlId;
  }
  if (attributes.settings) {
    props['data-settings'] = attributes.settings;
  }
  if (widget) {
    props['data-widget_type'] = widget;
  }
  return props;
}

/**
 * A link as blocks write it, as an address (harlow_link_url()).
 *
 * @param {string} link The link as written.
 * @return {string} The address.
 */
function linkUrl(link) {
  if (!link || /^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(link)) {
    return link;
  }
  if (link.startsWith('assets/')) {
    return `${site.themeUri}/${link}`;
  }
  const m = link.match(/^([\w-]+)\.html(#.*)?$/);
  if (m && site.pages[m[1]]) {
    return site.pages[m[1]] + (m[2] || '');
  }
  return link;
}

/**
 * The readable links of a piece of markup as addresses (harlow_resolve_links()).
 *
 * @param {string} html Markup.
 * @return {string} The markup with its links resolved.
 */
function resolveLinks(html) {
  if (!html || !html.includes('.html') && !html.includes('assets/')) {
    return html;
  }
  const holder = document.createElement('template');
  holder.innerHTML = html;
  holder.content.querySelectorAll('*').forEach(el => {
    ['href', 'src', 'poster'].forEach(name => {
      if (el.hasAttribute(name)) {
        el.setAttribute(name, linkUrl(el.getAttribute(name)));
      }
    });
    const style = el.getAttribute('style');
    if (style && style.includes('assets/')) {
      el.setAttribute('style', style.replace(/url\((["']?)(assets\/[^)"']+)\1\)/g, (all, quote, path) => `url(${quote}${linkUrl(path)}${quote})`));
    }
  });
  return holder.innerHTML;
}

/**
 * An inline style as React's style object.
 *
 * @param {string} style The style attribute.
 * @return {Object} The style object.
 */
function styleObject(style) {
  const out = {};
  (style || '').split(';').forEach(part => {
    const at = part.indexOf(':');
    if (at < 1) {
      return;
    }
    const name = part.slice(0, at).trim();
    const key = name.startsWith('--') ? name : name.replace(/-([a-z])/g, (all, c) => c.toUpperCase());
    out[key] = part.slice(at + 1).trim();
  });
  return out;
}

/**
 * HTML attributes as React props: class as className, style as an object.
 *
 * @param {Object} attrs Attribute names and values.
 * @return {Object} Props.
 */
function attributeProps(attrs) {
  const props = {};
  Object.entries(attrs || {}).forEach(([name, value]) => {
    if (name === 'class') {
      props.className = value;
    } else if (name === 'style') {
      props.style = styleObject(value);
    } else if (name === 'tabindex') {
      props.tabIndex = value;
    } else {
      props[name] = value;
    }
  });
  return props;
}

/**
 * An icon's markup inside its holder, with the line breaks the page prints around it.
 *
 * @param {string}  svg    The icon's markup.
 * @param {boolean} spaced Line breaks before and after, as the page has them.
 * @return {Object} dangerouslySetInnerHTML prop.
 */
function iconHtml(svg, spaced = true) {
  return {
    __html: spaced ? `\n${svg}\n` : svg
  };
}

/**
 * Choose one of the site's icons (the ones its pages use).
 *
 * @param {Object}   props
 * @param {string}   props.value     The icon chosen.
 * @param {Function} props.onChange  Called with the new icon's markup.
 * @param {boolean}  props.allowNone Offer "no icon".
 */
function IconPicker({
  value,
  onChange,
  allowNone = false
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
    className: "harlow-icon-picker",
    children: [allowNone && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
      variant: value ? 'secondary' : 'primary',
      onClick: () => onChange(''),
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('No icon', 'harlow')
    }), _icons_json__WEBPACK_IMPORTED_MODULE_7__.map((svg, i) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
      className: "harlow-icon-picker__icon",
      isPressed: svg === value,
      label: `${(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Icon', 'harlow')} ${i + 1}`,
      onClick: () => onChange(svg),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("span", {
        dangerouslySetInnerHTML: {
          __html: svg
        }
      })
    }, i))]
  });
}

/**
 * The fields of a link: address, new tab, rel.
 *
 * @param {Object}   props
 * @param {Object}   props.value    An object with link, linkTarget, linkRel.
 * @param {Function} props.onChange Called with the changed fields.
 */
function LinkFields({
  value,
  onChange
}) {
  const link = value.link || '';
  const named = /^([\w-]+)\.html(#.*)?$/.exec(link);
  const targets = site.linkTargets || [];
  const picked = named && targets.some(t => t.name === named[1]) ? named[1] : '';
  const part = picked ? named[2] || '' : '';
  const toPage = (name, hash) => onChange({
    link: name ? `${name}.html${hash}` : ''
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.ComboboxControl, {
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Page of the site', 'harlow'),
      help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('The link follows the page when its address changes.', 'harlow'),
      value: picked,
      options: targets.map(t => ({
        value: t.name,
        label: t.type ? `${t.title} (${t.type})` : t.title
      })),
      onChange: name => toPage(name, part)
    }), picked && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Part of the page', 'harlow'),
      help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Optional: a section’s id, such as #section-2.', 'harlow'),
      value: part,
      onChange: hash => toPage(picked, hash && !hash.startsWith('#') ? `#${hash}` : hash)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Or an address', 'harlow'),
      help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Another site’s address, mailto: or tel:.', 'harlow'),
      value: picked ? '' : link,
      onChange: typed => onChange({
        link: typed
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.ToggleControl, {
      __nextHasNoMarginBottom: true,
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Open in a new tab', 'harlow'),
      checked: value.linkTarget === '_blank',
      onChange: on => onChange({
        linkTarget: on ? '_blank' : ''
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Link relation (rel)', 'harlow'),
      value: value.linkRel || '',
      onChange: linkRel => onChange({
        linkRel
      })
    })]
  });
}

/**
 * A panel with the link fields of a block whose attributes hold one.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 */
function LinkPanel({
  attributes,
  setAttributes
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__.InspectorControls, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.PanelBody, {
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Link', 'harlow'),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(LinkFields, {
        value: attributes,
        onChange: setAttributes
      })
    })
  });
}

/**
 * The server's markup of a block, shown as the block's own element: the block's props on
 * its element, so the canvas has the same elements as the page. Markup of several
 * elements (a list printed as its cards alone) goes in a holder the canvas draws as
 * display: contents. For the blocks whose contents are kept elsewhere (menus, list items,
 * header and footer settings).
 *
 * @param {Object}   props
 * @param {string}   props.name       The block's name.
 * @param {Object}   props.attributes The block's attributes.
 * @param {Function} props.onMarkup   Called with the element once its markup is in; what
 *                                    it returns is called when the markup goes.
 */
function ServerMarkup({
  name,
  attributes,
  onMarkup
}) {
  const postId = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_3__.useSelect)(select => select('core/editor')?.getCurrentPostId(), []);
  const [html, setHtml] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.useState)(null);
  const key = JSON.stringify(attributes);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.useEffect)(() => {
    let live = true;
    _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({
      path: (0,_wordpress_url__WEBPACK_IMPORTED_MODULE_6__.addQueryArgs)(`/wp/v2/block-renderer/${name}`, {
        context: 'edit',
        post_id: postId
      }),
      method: 'POST',
      data: {
        attributes
      }
    }).then(response => live && setHtml(response.rendered)).catch(() => live && setHtml(''));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key, postId]);
  const root = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.useMemo)(() => {
    if (html === null) {
      return null;
    }
    const holder = document.createElement('template');
    holder.innerHTML = html.trim();
    const el = holder.content.firstElementChild;
    if (!el || holder.content.children.length > 1) {
      return {
        tag: 'div',
        props: {
          className: 'harlow-server-markup'
        },
        inner: html
      };
    }
    const attrs = {};
    [...el.attributes].forEach(a => {
      attrs[a.name] = a.value;
    });
    return {
      tag: el.tagName.toLowerCase(),
      props: attributeProps(attrs),
      inner: el.innerHTML
    };
  }, [html]);
  const ref = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.useRef)();
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__.useBlockProps)({
    ...(root ? root.props : {
      className: 'harlow-loading'
    }),
    ref,
    // Links in the server's markup do not leave the editor.
    onClick: event => {
      if (event.target.closest('a')) {
        event.preventDefault();
      }
    }
  });
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.useLayoutEffect)(() => {
    if (root && ref.current && onMarkup) {
      return onMarkup(ref.current);
    }
  }, [root, onMarkup]);
  const Tag = root ? root.tag : 'div';
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(Tag, {
    ...blockProps,
    dangerouslySetInnerHTML: {
      __html: root ? root.inner : ''
    }
  });
}

/***/ },

/***/ "./theme/editor/ui.css"
/*!*****************************!*\
  !*** ./theme/editor/ui.css ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/api-fetch"
/*!**********************************!*\
  !*** external ["wp","apiFetch"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["apiFetch"];

/***/ },

/***/ "@wordpress/block-editor"
/*!*************************************!*\
  !*** external ["wp","blockEditor"] ***!
  \*************************************/
(module) {

module.exports = window["wp"]["blockEditor"];

/***/ },

/***/ "@wordpress/blocks"
/*!********************************!*\
  !*** external ["wp","blocks"] ***!
  \********************************/
(module) {

module.exports = window["wp"]["blocks"];

/***/ },

/***/ "@wordpress/components"
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["components"];

/***/ },

/***/ "@wordpress/compose"
/*!*********************************!*\
  !*** external ["wp","compose"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["compose"];

/***/ },

/***/ "@wordpress/core-data"
/*!**********************************!*\
  !*** external ["wp","coreData"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["coreData"];

/***/ },

/***/ "@wordpress/data"
/*!******************************!*\
  !*** external ["wp","data"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["data"];

/***/ },

/***/ "@wordpress/editor"
/*!********************************!*\
  !*** external ["wp","editor"] ***!
  \********************************/
(module) {

module.exports = window["wp"]["editor"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ },

/***/ "@wordpress/escape-html"
/*!************************************!*\
  !*** external ["wp","escapeHtml"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["escapeHtml"];

/***/ },

/***/ "@wordpress/hooks"
/*!*******************************!*\
  !*** external ["wp","hooks"] ***!
  \*******************************/
(module) {

module.exports = window["wp"]["hooks"];

/***/ },

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ },

/***/ "@wordpress/plugins"
/*!*********************************!*\
  !*** external ["wp","plugins"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["plugins"];

/***/ },

/***/ "@wordpress/url"
/*!*****************************!*\
  !*** external ["wp","url"] ***!
  \*****************************/
(module) {

module.exports = window["wp"]["url"];

/***/ },

/***/ "./theme/blocks/accordion-item/block.json"
/*!************************************************!*\
  !*** ./theme/blocks/accordion-item/block.json ***!
  \************************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/accordion-item","title":"Question","category":"text","description":"A question of an accordion and its answer.","textdomain":"harlow","parent":["harlow/accordion"],"attributes":{"tab":{"type":"integer","default":1},"itemId":{"type":"integer","default":0},"title":{"type":"string","default":""},"expanded":{"type":"string","default":"false"},"titleClass":{"type":"string","default":"elementor-tab-title"},"contentClass":{"type":"string","default":"elementor-tab-content elementor-clearfix"},"contentStyle":{"type":"string","default":""}},"usesContext":["harlow/iconClosed","harlow/iconOpened"],"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/accordion-item.php"}');

/***/ },

/***/ "./theme/blocks/accordion/block.json"
/*!*******************************************!*\
  !*** ./theme/blocks/accordion/block.json ***!
  \*******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/accordion","title":"Accordion","category":"text","description":"Questions that open their answers one at a time.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"iconClosed":{"type":"string","default":""},"iconOpened":{"type":"string","default":""}},"providesContext":{"harlow/iconClosed":"iconClosed","harlow/iconOpened":"iconOpened"},"allowedBlocks":["harlow/accordion-item"],"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/accordion.php"}');

/***/ },

/***/ "./theme/blocks/box/block.json"
/*!*************************************!*\
  !*** ./theme/blocks/box/block.json ***!
  \*************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/box","title":"Box","category":"text","description":"A box around paragraphs, as the text of an older page has it.","textdomain":"harlow","attributes":{"tag":{"type":"string","default":"div"},"htmlAttributes":{"type":"object","default":{}}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/box.php"}');

/***/ },

/***/ "./theme/blocks/button/block.json"
/*!****************************************!*\
  !*** ./theme/blocks/button/block.json ***!
  \****************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/button","title":"Button","category":"design","description":"A button with its words, its link and an icon if it has one.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"buttonClass":{"type":"string","default":"elementor-button elementor-button-link elementor-size-sm"},"link":{"type":"string","default":""},"linkTarget":{"type":"string","default":""},"linkRel":{"type":"string","default":""},"linkId":{"type":"string","default":""},"icon":{"type":"string","default":""},"text":{"type":"string","default":""},"iconAfter":{"type":"boolean","default":false},"hasIcon":{"type":"boolean","default":false}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/button.php"}');

/***/ },

/***/ "./theme/blocks/container/block.json"
/*!*******************************************!*\
  !*** ./theme/blocks/container/block.json ***!
  \*******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/container","title":"Container","category":"layout","description":"A box that holds other blocks: a section, a column, a row of cards.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"boxed":{"type":"boolean","default":false},"video":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/container.php"}');

/***/ },

/***/ "./theme/blocks/divider/block.json"
/*!*****************************************!*\
  !*** ./theme/blocks/divider/block.json ***!
  \*****************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/divider","title":"Divider","category":"design","description":"A line between parts of a section.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/divider.php"}');

/***/ },

/***/ "./theme/blocks/document/block.json"
/*!******************************************!*\
  !*** ./theme/blocks/document/block.json ***!
  \******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/document","title":"Elementor document","category":"layout","description":"The box around a page\'s sections, or a shared section\'s blocks.","textdomain":"harlow","attributes":{"docType":{"type":"string","default":"container"},"docId":{"type":"integer","default":0},"postType":{"type":"string","default":"elementor_library"},"location":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/document.php"}');

/***/ },

/***/ "./theme/blocks/gallery/block.json"
/*!*****************************************!*\
  !*** ./theme/blocks/gallery/block.json ***!
  \*****************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/gallery","title":"Gallery","category":"media","description":"Pictures in a grid that open in the lightbox: chosen here, or the pictures of the item the page shows.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"pictures":{"type":"array","default":[],"items":{"type":"integer"}},"source":{"type":"string","default":""},"captions":{"type":"boolean","default":false}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/gallery.php"}');

/***/ },

/***/ "./theme/blocks/heading/block.json"
/*!*****************************************!*\
  !*** ./theme/blocks/heading/block.json ***!
  \*****************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/heading","title":"Heading","category":"text","description":"A title or a short line of words, in the design\'s heading styles.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"tag":{"type":"string","default":"h2"},"size":{"type":"string","default":"default"},"text":{"type":"string","default":""},"source":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/heading.php"}');

/***/ },

/***/ "./theme/blocks/html/block.json"
/*!**************************************!*\
  !*** ./theme/blocks/html/block.json ***!
  \**************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/html","title":"HTML","category":"widgets","description":"Markup written by hand (the history slider).","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"html":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/html.php"}');

/***/ },

/***/ "./theme/blocks/icon-list/block.json"
/*!*******************************************!*\
  !*** ./theme/blocks/icon-list/block.json ***!
  \*******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/icon-list","title":"Icon list","category":"text","description":"A list of lines, each with an icon and a link if it has one.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"inline":{"type":"boolean","default":false},"items":{"type":"array","default":[]}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/icon-list.php"}');

/***/ },

/***/ "./theme/blocks/icon/block.json"
/*!**************************************!*\
  !*** ./theme/blocks/icon/block.json ***!
  \**************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/icon","title":"Icon","category":"design","description":"An icon from the site\'s icon set.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"icon":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/icon.php"}');

/***/ },

/***/ "./theme/blocks/image/block.json"
/*!***************************************!*\
  !*** ./theme/blocks/image/block.json ***!
  \***************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/image","title":"Image","category":"media","description":"A picture from the Media Library, with a link if it has one.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"image":{"type":"integer","default":0},"size":{"type":"string","default":"large"},"alt":{"type":"string","default":""},"title":{"type":"string","default":""},"src":{"type":"string","default":""},"width":{"type":"string","default":""},"height":{"type":"string","default":""},"imgClass":{"type":"string","default":""},"link":{"type":"string","default":""},"linkTarget":{"type":"string","default":""},"linkRel":{"type":"string","default":""},"source":{"type":"string","default":""},"widgetType":{"type":"string","default":"image.default"}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/image.php"}');

/***/ },

/***/ "./theme/blocks/loop/block.json"
/*!**************************************!*\
  !*** ./theme/blocks/loop/block.json ***!
  \**************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/loop","title":"List of items","category":"widgets","icon":"grid-view","description":"Posts, news, projects, gallery items, jobs, business models, people, testimonials or client logos, as cards, a carousel or plain. Shows the items by itself.","textdomain":"harlow","attributes":{"widget":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":"{}"},"layout":{"type":"string","enum":["grid","carousel","plain","box"],"default":"grid"},"boxed":{"type":"boolean","default":false},"postType":{"type":"string","default":"post"},"template":{"type":"string","default":"post-card"},"perPage":{"type":"integer","default":6},"orderby":{"type":"string","enum":["date","menu_order"],"default":"date"},"order":{"type":"string","enum":["DESC","ASC"],"default":"DESC"},"pagination":{"type":"string","enum":["","numbers","prev_next"],"default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/loop.php"}');

/***/ },

/***/ "./theme/blocks/markup/block.json"
/*!****************************************!*\
  !*** ./theme/blocks/markup/block.json ***!
  \****************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/markup","title":"HTML","category":"text","description":"One element of a text written as HTML, as the text of an older page has it (words beside a form button, a spacer).","textdomain":"harlow","attributes":{"html":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/markup.php"}');

/***/ },

/***/ "./theme/blocks/nav-menu/block.json"
/*!******************************************!*\
  !*** ./theme/blocks/nav-menu/block.json ***!
  \******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/nav-menu","title":"Menu","category":"widgets","description":"One of the site\'s menus (Appearance > Menus).","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"navClass":{"type":"string","default":""},"vertical":{"type":"boolean","default":false},"menu":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/nav-menu.php"}');

/***/ },

/***/ "./theme/blocks/post-content/block.json"
/*!**********************************************!*\
  !*** ./theme/blocks/post-content/block.json ***!
  \**********************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/post-content","title":"Item\'s text","category":"theme","description":"The text of the item the page shows (Elementor\'s post content widget).","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/post-content.php"}');

/***/ },

/***/ "./theme/blocks/shortcode/block.json"
/*!*******************************************!*\
  !*** ./theme/blocks/shortcode/block.json ***!
  \*******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/shortcode","title":"Shortcode output","category":"widgets","description":"A shortcode (a form) printed by its plugin, or what a plugin printed on live (the group chart).","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"html":{"type":"string","default":""},"shortcode":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/shortcode.php"}');

/***/ },

/***/ "./theme/blocks/site-part/block.json"
/*!*******************************************!*\
  !*** ./theme/blocks/site-part/block.json ***!
  \*******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/site-part","title":"Site header or footer","category":"layout","description":"The site\'s header or footer, inside a page that builds its own (the home page).","textdomain":"harlow","attributes":{"part":{"type":"string","enum":["header","footer"],"default":"header"},"embedded":{"type":"boolean","default":false}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/site-part.php"}');

/***/ },

/***/ "./theme/blocks/social-icons/block.json"
/*!**********************************************!*\
  !*** ./theme/blocks/social-icons/block.json ***!
  \**********************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/social-icons","title":"Social icons","category":"widgets","description":"Icons that link to the site\'s social networks.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""},"items":{"type":"array","default":[]}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/social-icons.php"}');

/***/ },

/***/ "./theme/blocks/template/block.json"
/*!******************************************!*\
  !*** ./theme/blocks/template/block.json ***!
  \******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/template","title":"Shared section","category":"layout","description":"A section used on many pages, edited once (a synced pattern), or the site header or footer.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/template.php"}');

/***/ },

/***/ "./theme/blocks/text/block.json"
/*!**************************************!*\
  !*** ./theme/blocks/text/block.json ***!
  \**************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"harlow/text","title":"Text","category":"text","description":"Paragraphs and lists.","textdomain":"harlow","attributes":{"element":{"type":"string","default":""},"classes":{"type":"string","default":""},"settings":{"type":"string","default":""},"htmlId":{"type":"string","default":""}},"supports":{"html":false,"className":false,"customClassName":false},"render":"file:../../includes/sections/text.php"}');

/***/ },

/***/ "./theme/editor/design-classes.json"
/*!******************************************!*\
  !*** ./theme/editor/design-classes.json ***!
  \******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('["hl-background-attachment-fixed--bg--xl","hl-bc-000000--view-default-icon","hl-bc-0165a1","hl-bc-0165a1--button","hl-bc-0165a1--img","hl-bc-d5d5d5","hl-bc-e6f0f6--button","hl-bc-ffffff--view-default-icon","hl-bc-ffffff9c--icon-list-item-n-61a77","hl-bgc-000000--background-video-c0bda","hl-bgc-000000--before","hl-bgc-00000000--before","hl-bgc-00000075--bg","hl-bgc-000000d6--before","hl-bgc-013c60--bg","hl-bgc-014167--bg","hl-bgc-015384--bg","hl-bgc-0165a1--bg","hl-bgc-0165a1--button","hl-bgc-0165a1--is-swiper-button-90a8f","hl-bgc-0165a1--wc","hl-bgc-0165a100--bg","hl-bgc-0165a100--button","hl-bgc-02010100--button-focus","hl-bgc-02010100--button-hover","hl-bgc-02010100--menu-toggle","hl-bgc-02010100--nav-menu-dropdow-341f5","hl-bgc-02010100--nav-menu-dropdow-343fd","hl-bgc-02010100--nav-menu-dropdow-96aeb","hl-bgc-02010100--nav-menu-dropdow-d9c33","hl-bgc-12421900--button","hl-bgc-54595f00--social-icon","hl-bgc-61ce7000--button","hl-bgc-b4b4b5--is-swiper-button-6267f","hl-bgc-e46e6e00--button","hl-bgc-e6f0f6--bg","hl-bgc-e6f0f6--button","hl-bgc-f2f2f2--bg","hl-bgc-f7f7f7--bg","hl-bgc-ffffff--bg","hl-bgc-ffffff--nav-menu-dropdow-341f5","hl-bgc-ffffff--nav-menu-dropdow-343fd","hl-bgc-ffffff--nav-menu-dropdow-96aeb","hl-bgc-ffffff--nav-menu-dropdow-d9c33","hl-bgc-ffffff--nav-menu-main-no-2c3ac","hl-bgc-ffffff--nav-menu-main-no-b3cc3","hl-bgc-rgba-0-0-0-0-5--e-gallery-item-f-2529b","hl-bgc-rgba-0-0-0-0-5--e-gallery-item-h-bdf3e","hl-bgc-transparent--before","hl-bgc-transparent--bg","hl-bgc-transparent--hover-before","hl-bgi-linear-gradient-0b9d9a--bg","hl-bgi-linear-gradient-19bae8--hover-before","hl-bgi-linear-gradient-6addcb--before","hl-bgi-linear-gradient-ab8473--bg","hl-bgi-linear-gradient-d68855--bg","hl-bgi-linear-gradient-fb177a--bg","hl-bgi-url-133116078506171098blog--bg","hl-bgi-url-133116721139490326care--bg","hl-bgi-url-133116740388411546grou--bg","hl-bgi-url-133129818766222552tttt--bg","hl-bgi-url-al-murabit-hero-min--bg","hl-bgi-url-al-murabit-security-se--bg","hl-bgi-url-application-hero--bg","hl-bgi-url-arrow--wc","hl-bgi-url-bg--bg","hl-bgi-url-blue-arrow--wc","hl-bgi-url-cement-min--bg","hl-bgi-url-download-min--bg","hl-bgi-url-download-min-1--bg","hl-bgi-url-download-min-2--bg","hl-bgi-url-download-min-3--bg","hl-bgi-url-drc-cement--bg","hl-bgi-url-energy-and-smart-solut--bg","hl-bgi-url-footer-images-1--bg","hl-bgi-url-group-polices--bg","hl-bgi-url-innerbanner--bg","hl-bgi-url-integratedservice-bg--bg","hl-bgi-url-kpp-3-units-new-scaled--bg","hl-bgi-url-message-sec-bg--bg","hl-bgi-url-offices-min--bg","hl-bgi-url-people-hero--bg","hl-bgi-url-photo-gallery-min--bg","hl-bgi-url-plus--bg","hl-bgi-url-smart-meters-min-min--bg","hl-bgp-0-0pct--bg--m","hl-bgp-0-0pct--bg--t","hl-bgp-0-75pct--bg","hl-bgp-0pct-0pct--bg--m","hl-bgp-0pct-0pct--bg--t","hl-bgp-160-21--wc","hl-bgp-170-20--wc--t","hl-bgp-175-20--wc--m","hl-bgp-center-center--bg","hl-bgp-center-right--wc","hl-bgp-n22pct-29pct--bg","hl-bgp-top-center--bg","hl-bgp-top-left--bg","hl-bgr-no-repeat--bg","hl-bgr-no-repeat--wc","hl-bgr-repeat--bg","hl-bgs-22px-auto--bg","hl-bgs-48-auto--bg","hl-bgs-auto--wc","hl-bgs-cover--bg","hl-bgs-cover--bg--t","hl-border-bottom-left-radius-12--nav-menu-dropdow-d43df","hl-border-bottom-right-radius-12--nav-menu-dropdow-d43df","hl-border-bottom-right-radius-20--nav-menu-dropdow-d43df","hl-border-bottom-width-0--nav-menu-dropdow-e607a","hl-border-inline-start-style-solid--icon-list-items--656ba","hl-border-inline-start-width-2--inline-items-ico-da403","hl-border-top-left-radius-12--nav-menu-dropdow-628c4","hl-border-top-left-radius-20--nav-menu-dropdow-628c4","hl-border-top-right-radius-12--nav-menu-dropdow-628c4","hl-bottom-0","hl-bottom-106","hl-bottom-140","hl-bottom-23--m","hl-bottom-23pct","hl-bottom-32--t","hl-bottom-56--m","hl-bottom-66--t","hl-bottom-75--m","hl-bottom-88","hl-bottom-n18","hl-bottom-n21","hl-bottom-n9","hl-box-shadow-0px-0px-10px-0px-df3383--img","hl-box-shadow-0px-4px-20px-0px-a7a56b--wc","hl-box-shadow-8px-0px-0px-0px-ad715f","hl-br-0-0-0-0--button","hl-br-12-12-12-12--nav-menu-dropdown","hl-br-20-12-20-12--nav-menu-dropdown","hl-br-3-3-3-3--is-swiper-button-6267f","hl-bs-none","hl-bs-none--button","hl-bs-none--nav-menu-dropdow-e607a","hl-bs-none--social-icon","hl-bs-solid","hl-bs-solid--button","hl-bs-solid--img","hl-bw-0-0-1-0--accordion-item","hl-bw-0-0-1-0--accordion-item-t-9abc4","hl-bw-0-0-1-0--accordion-item-t-db365","hl-bw-1-1-1-1","hl-bw-1-1-1-1--button","hl-bw-13-1-13-1","hl-bw-2-2-2-2","hl-bw-2-2-2-2--button","hl-bw-2-2-2-2--img","hl-c-000000","hl-c-000000--ht","hl-c-000000--ilt","hl-c-000000--menu-toggle","hl-c-000000--menu-toggle-focus","hl-c-000000--menu-toggle-hover","hl-c-000000--nav-menu-dropdow-341f5","hl-c-000000--nav-menu-dropdow-343fd","hl-c-000000--nav-menu-dropdow-96aeb","hl-c-000000--nav-menu-dropdow-d9c33","hl-c-000000--nav-menu-dropdown-a","hl-c-000000--nav-menu-main-item","hl-c-000000--view-default-icon","hl-c-000000--widget-container","hl-c-00000078--button","hl-c-001420","hl-c-001420--button","hl-c-001420--ht","hl-c-002840--ht","hl-c-00cccc--ht","hl-c-0165a1--button","hl-c-0165a1--button-focus","hl-c-0165a1--button-hover","hl-c-0165a1--ht","hl-c-0165a1--menu-toggle-focus","hl-c-0165a1--menu-toggle-hover","hl-c-0165a1--nav-menu-dropdow-341f5","hl-c-0165a1--nav-menu-dropdow-343fd","hl-c-0165a1--nav-menu-dropdow-96aeb","hl-c-0165a1--nav-menu-dropdow-d9c33","hl-c-0165a1--nav-menu-main-it-cb62e","hl-c-0165a1--pagination-page--5532f","hl-c-181818--ht","hl-c-1c1d1d--ht","hl-c-212529--accordion-icon","hl-c-212529--accordion-title","hl-c-212529--active-accordion-icon","hl-c-212529--active-accordion-title","hl-c-212529--tab-content","hl-c-6adadb--ht","hl-c-9b9b9b--pagination-page--a902d","hl-c-fffefe","hl-c-ffffff","hl-c-ffffff--div-menu-toggle","hl-c-ffffff--ht","hl-c-ffffff--ilt","hl-c-ffffff--nav-menu-main-it-bc12a","hl-c-ffffff--nav-menu-main-it-cb62e","hl-c-ffffff--nav-menu-main-item","hl-c-ffffff--nav-menu-main-item-focus","hl-c-ffffff--nav-menu-main-item-hover","hl-c-ffffff--view-default-icon","hl-c-ffffff94--nav-menu-main-it-bc12a","hl-c-ffffff94--nav-menu-main-it-cb62e","hl-c-ffffff94--nav-menu-main-item-focus","hl-c-ffffff94--nav-menu-main-item-hover","hl-c-ffffff9c--ht","hl-c-ffffff9c--ilt","hl-c-ffffff9e--ht","hl-column-gap-0","hl-content---icon-list-item-n-61a77","hl-ff-plus-jakarta-san-4f7b99","hl-ff-plus-jakarta-san-4f7b99--accordion-title","hl-ff-plus-jakarta-san-4f7b99--button","hl-ff-plus-jakarta-san-4f7b99--gallery-item-title","hl-ff-plus-jakarta-san-4f7b99--ht","hl-ff-plus-jakarta-san-4f7b99--icon-list-item-a","hl-ff-plus-jakarta-san-4f7b99--icon-list-item-i-11f53","hl-ff-plus-jakarta-san-4f7b99--nav-menu-dropdow-b368b","hl-ff-plus-jakarta-san-4f7b99--nav-menu-dropdown-item","hl-ff-plus-jakarta-san-4f7b99--nav-menu-item","hl-ff-plus-jakarta-san-4f7b99--tab-content","hl-ff-roboto-sans-serif","hl-ff-roboto-sans-serif--button","hl-ff-roboto-sans-serif--ht","hl-ff-roboto-sans-serif--icon-list-item-a","hl-ff-roboto-sans-serif--widget-container","hl-ff-roboto-slab-sans-serif--pagination","hl-fill-000000--ili-svg","hl-fill-000000--menu-toggle","hl-fill-000000--nav-menu-dropdown-a","hl-fill-000000--nav-menu-main-item","hl-fill-000000--view-default-icon-svg","hl-fill-00000078--button","hl-fill-001420--button","hl-fill-0165a1--button","hl-fill-212529--accordion-icon-svg","hl-fill-212529--active-accordion-b1b1b","hl-fill-ffffff--div-menu-toggle-svg","hl-fill-ffffff--ili-svg","hl-fill-ffffff--nav-menu-main-it-bc12a","hl-fill-ffffff--nav-menu-main-it-cb62e","hl-fill-ffffff--nav-menu-main-item","hl-fill-ffffff--nav-menu-main-item-focus","hl-fill-ffffff--nav-menu-main-item-hover","hl-fill-ffffff--view-default-icon-svg","hl-fill-ffffff94--icon-list-item-h-e666d","hl-fill-ffffff94--nav-menu-main-it-bc12a","hl-fill-ffffff94--nav-menu-main-it-cb62e","hl-fill-ffffff94--nav-menu-main-item-focus","hl-fill-ffffff94--nav-menu-main-item-hover","hl-filter-brightness-100-c-76b369--before","hl-flex-direction-row-reverse--button-content-wrapper","hl-fs-12--button","hl-fs-12--button--t","hl-fs-12--ht","hl-fs-12--ht--m","hl-fs-12--icon","hl-fs-13--ht","hl-fs-13--ht--m","hl-fs-13--m","hl-fs-13--nav-menu-item","hl-fs-14","hl-fs-14--button","hl-fs-14--ht","hl-fs-15","hl-fs-15--ht","hl-fs-15--icon-list-item-a","hl-fs-15--nav-menu-dropdow-b368b","hl-fs-15--nav-menu-dropdown-item","hl-fs-16","hl-fs-16--button","hl-fs-16--gallery-item-title","hl-fs-16--ht","hl-fs-16--ht--m","hl-fs-16--m","hl-fs-16--nav-menu-item","hl-fs-18","hl-fs-18--ht","hl-fs-18--ht--m","hl-fs-18--icon","hl-fs-18--nav-menu-dropdow-b368b","hl-fs-18--nav-menu-dropdown-item","hl-fs-18--nav-menu-item","hl-fs-18--pagination","hl-fs-19--ht--m","hl-fs-1_25rem--accordion-title","hl-fs-1rem--tab-content","hl-fs-20--ht","hl-fs-21--ht","hl-fs-21--ht--m","hl-fs-22--ht","hl-fs-23--ht","hl-fs-23--ht--m","hl-fs-24--ht--m","hl-fs-24--m","hl-fs-26--button","hl-fs-26--ht","hl-fs-26--ht--m","hl-fs-27--ht","hl-fs-28","hl-fs-28--ht--m","hl-fs-30--ht","hl-fs-32","hl-fs-32--ht","hl-fs-35--ht","hl-fs-36--ht","hl-fs-42--ht","hl-fst-italic--ht","hl-fst-normal--button","hl-fw-300","hl-fw-300--nav-menu-item","hl-fw-300--tab-content","hl-fw-400","hl-fw-400--button","hl-fw-400--gallery-item-title","hl-fw-400--ht","hl-fw-400--icon-list-item-a","hl-fw-400--icon-list-item-i-11f53","hl-fw-400--nav-menu-item","hl-fw-400--widget-container","hl-fw-500","hl-fw-500--accordion-title","hl-fw-500--ht","hl-fw-500--icon-list-item-a","hl-fw-500--nav-menu-dropdow-b368b","hl-fw-500--nav-menu-dropdown-item","hl-fw-500--nav-menu-item","hl-fw-600","hl-fw-600--button","hl-fw-600--ht","hl-fw-600--nav-menu-dropdow-b368b","hl-fw-600--nav-menu-dropdown-item","hl-fw-600--nav-menu-item","hl-fw-600--pagination","hl-fw-700","hl-fw-700--button","hl-fw-700--ht","hl-fw-800--ht","hl-gap-10--button-button-co-5357c","hl-grid-auto-rows-1fr--loop-container","hl-h-0--e-pointer-underl-0ee8a","hl-h-100pct--e-loop-item-e-con","hl-h-100pct--img","hl-h-100pct--img--m","hl-h-100pct--swiper-slide-element","hl-h-12--icon-svg","hl-h-16--icon-list-item-n-61a77","hl-h-18--icon-svg","hl-h-200--img","hl-h-250--img--t","hl-h-285--img--m","hl-h-300--img","hl-h-330--img","hl-h-400--img","hl-h-510--img","hl-inset-inline-end-calc-20px-2--icon-list-items--d5ce9","hl-inset-inline-end-calc-20px-2--icon-list-items--d5ce9--t","hl-inset-inline-end-calc-8px-2--icon-list-items--d5ce9","hl-lh-160pct","hl-lh-160pct--ht","hl-lh-170pct","hl-lh-18--ht","hl-lh-1_2--ht","hl-lh-1_2em--ht--m","hl-lh-1_2em--m","hl-lh-1_2rem--ht--t","hl-lh-1_3--ht","hl-lh-1_3em--ht","hl-lh-1_3em--ht--m","hl-lh-1_4em--ht","hl-lh-1_4em--ht--m","hl-lh-1_5em--ht","hl-lh-1_6em--ht--m","hl-lh-20--ht","hl-lh-21","hl-lh-21--ht","hl-lh-22--button","hl-lh-22--widget-container","hl-lh-24","hl-lh-24--ht","hl-lh-26","hl-lh-26--ht","hl-lh-28","hl-lh-2_1em--ht--m","hl-lh-4","hl-lh-40--ht","hl-ls-0_006em--ht","hl-ls-0_4--ht","hl-ls-0_6--button","hl-ls-0_6--ht","hl-ls-0_6--nav-menu-item","hl-ls-1_2--ht--m","hl-ls-2_1--ht","hl-ls-3--button","hl-ls-4--ht","hl-ls-n0_1--nav-menu-dropdow-b368b","hl-ls-n0_1--nav-menu-dropdown-item","hl-ltr-left-0","hl-ltr-left-0pct","hl-ltr-left-14--m","hl-ltr-left-22","hl-ltr-left-24pct--t","hl-ltr-left-34pct--t","hl-ltr-left-365","hl-ltr-left-41pct","hl-ltr-left-50pct--m","hl-ltr-left-64","hl-ltr-left-75","hl-ltr-left-8--m","hl-ltr-left-85pct","hl-ltr-left-87pct","hl-ltr-left-88pct","hl-ltr-left-89--t","hl-ltr-left-n14","hl-ltr-left-n32","hl-ltr-left-n87pct","hl-ltr-margin-left-calc-30px-2--pagination-page--1ecd0","hl-ltr-margin-right-calc-30px-2--pagination-page--5ffaa","hl-ltr-right-0pct","hl-ltr-right-17","hl-ltr-right-20","hl-m-0-0-0-0--wc","hl-m-0-0-0-0--wc--m","hl-m-0-0-0-45--wc","hl-m-0-0-0-90--wc","hl-m-0-0-10-0--wc","hl-m-0-0-11-0--wc","hl-m-0-0-15-0--wc","hl-m-0-0-19-0--wc","hl-m-0-0-20-0--wc","hl-m-0-0-21-0--wc--t","hl-m-0-0-22-0--wc","hl-m-0-0-25-0--wc","hl-m-0-0-28-0--wc","hl-m-0-0-30-0--wc","hl-m-0-0-35-0--wc","hl-m-0-0-40-0--wc","hl-m-0-0-5-0--wc","hl-m-0-0-5-0--wc--m","hl-m-0-0-55-0--wc","hl-m-0-0-7-0--wc","hl-m-0-0-n15-0--wc--m","hl-m-0-0-n4-0--wc","hl-m-0-auto--menu-toggle","hl-m-0-auto--sep","hl-m-0-auto--sep--m","hl-m-10-0-0-0--wc","hl-m-48-0-0-0--wc","hl-m-5-0-0-0--wc--m","hl-m-5-0-n20-0--wc","hl-m-n10-0-0-0--wc","hl-m-n15-0-0-0--wc","hl-m-n21-0-0-0--wc","hl-m-n23-0-30-0--wc","hl-m-n26-0-n15-0--wc--m","hl-m-n29-0-0-0--wc--m","hl-m-n30-0-0-0--wc--t","hl-m-n34-0-0-0--wc","hl-m-n4-0-0-0--wc","hl-margin-block-start-calc-15px-2--icon-list-items--aff99","hl-margin-inline-calc-20px-2--icon-list-items--625e6","hl-margin-inline-calc-20px-2--icon-list-items--625e6--t","hl-margin-inline-calc-20px-2--icon-list-items--bf6b1","hl-margin-inline-calc-20px-2--icon-list-items--bf6b1--t","hl-margin-inline-calc-8px-2--icon-list-items--625e6","hl-margin-inline-calc-8px-2--icon-list-items--bf6b1","hl-margin-left-0--sep","hl-margin-top-40--pagination","hl-mw-100","hl-mw-100--t","hl-mw-100pct","hl-mw-100pct--img","hl-mw-100pct--m","hl-mw-100pct--t","hl-mw-111--m","hl-mw-113_923pct","hl-mw-116","hl-mw-120--img--m","hl-mw-130","hl-mw-136","hl-mw-20--img","hl-mw-237","hl-mw-23_352pct","hl-mw-246--m","hl-mw-250--img--m","hl-mw-289","hl-mw-300--img--m","hl-mw-300--m","hl-mw-307--m","hl-mw-331","hl-mw-350--img--m","hl-mw-373--t","hl-mw-37pct","hl-mw-400--img","hl-mw-429--t","hl-mw-5--img","hl-mw-51pct","hl-mw-55pct","hl-mw-59_25--m","hl-mw-62_97pct","hl-mw-721--t","hl-mw-75_906pct","hl-mw-80--m","hl-mw-88pct","hl-mw-90pct--img","hl-mw-93pct--img--m","hl-mw-94--img","hl-mw-95_063pct","hl-mw-96pct","hl-mw-auto","hl-mw-initial","hl-of-contain--img--m","hl-of-cover--img","hl-of-cover--img--m","hl-of-cover--img--t","hl-op-center-center--img","hl-p-0-0-0-0--button","hl-p-0-0-0-0--tab-content","hl-p-0-0-0-0--wc","hl-p-0-0-0-0--wc--m","hl-p-0-0-0-0--wc--t","hl-p-0-0-10-0--wc","hl-p-0-0-14-0--wc","hl-p-0-0-15-0--wc","hl-p-0-0-17-0--wc","hl-p-0-0-20-0--wc","hl-p-0-0-25-0--wc","hl-p-0-0-30-0--wc","hl-p-0-0-n1-0--wc","hl-p-0-15-0-1--wc","hl-p-0-20-0-20--wc--t","hl-p-0-5-5-5--button","hl-p-0rem-0rem-0rem-0rem--wc","hl-p-10-130-10-130--button--t","hl-p-10-17-10-17--button","hl-p-11-11-11-11--is-swiper-button-6267f","hl-p-12-40-12-40--button--m","hl-p-12-55-12-55--button","hl-p-20-66-20-50--button","hl-p-3-0-3-0--wc","hl-p-4-0-0-0--wc","hl-p-8-24-8-24--button","hl-padding-block-end-15--div","hl-padding-block-end-2--div","hl-padding-block-end-calc-15px-2--icon-list-items--0b8dc","hl-padding-block-start-15--div","hl-padding-block-start-2--div","hl-padding-bottom-10--nav-menu-main-item","hl-padding-bottom-14--nav-menu-main-item","hl-padding-bottom-15--nav-menu-main-item","hl-padding-bottom-17--nav-menu-dropdown-a","hl-padding-bottom-6--nav-menu-dropdown-a","hl-padding-bottom-7--nav-menu-main-item","hl-padding-inline-end-1--icon-list-icon","hl-padding-left-0--nav-menu-dropdown-a","hl-padding-left-0--nav-menu-main-item","hl-padding-left-20--nav-menu-dropdown-a","hl-padding-right-0--nav-menu-dropdown-a","hl-padding-right-0--nav-menu-main-item","hl-padding-right-20--nav-menu-dropdown-a","hl-padding-top-10--nav-menu-main-item","hl-padding-top-14--nav-menu-main-item","hl-padding-top-15--nav-menu-main-item","hl-padding-top-17--nav-menu-dropdown-a","hl-padding-top-6--nav-menu-dropdown-a","hl-padding-top-7--nav-menu-main-item","hl-ta-center","hl-ta-center--div","hl-ta-center--div--m","hl-ta-center--icon-wrapper","hl-ta-center--m","hl-ta-center--pagination","hl-ta-center--t","hl-ta-center--widget-container","hl-ta-end","hl-ta-justify","hl-ta-justify--m","hl-ta-justify--t","hl-ta-left--div","hl-ta-start","hl-ta-start--icon-wrapper","hl-ta-start--m","hl-top-0","hl-top-15","hl-top-150","hl-top-23pct","hl-top-33","hl-top-4--m","hl-top-45","hl-top-7","hl-top-n19","hl-top-n30","hl-top-n30--m","hl-top-n30--t","hl-transition-color-0-3s--ilt","hl-transition-fill-0-3s--ili-svg","hl-tt-capitalize","hl-tt-uppercase","hl-tt-uppercase--button","hl-tt-uppercase--ht","hl-tt-uppercase--icon-list-item-a","hl-tt-uppercase--icon-list-item-i-11f53","hl-v-align-items-center","hl-v-align-items-center--m","hl-v-align-items-center--t","hl-v-align-items-flex-start","hl-v-align-items-flex-start--t","hl-v-align-self-center--con","hl-v-align-self-center--con--m","hl-v-align-self-center--con--t","hl-v-align-self-center--el","hl-v-align-self-center--el--m","hl-v-align-self-center--el--t","hl-v-align-self-flex-end--con","hl-v-align-self-flex-end--el","hl-v-align-self-flex-start--con","hl-v-align-self-flex-start--el","hl-v-align-self-flex-start--el--t","hl-v-align-self-stretch--con","hl-v-arrow-next-caption-spacing-0","hl-v-arrow-next-caption-spacing-0--t","hl-v-arrow-next-right-align-100pct","hl-v-arrow-next-right-position-calc-87-70px","hl-v-arrow-next-right-position-n54pct--t","hl-v-arrow-next-right-position-n55pct--m","hl-v-arrow-next-top-align-0pct","hl-v-arrow-next-top-align-0pct--t","hl-v-arrow-next-top-position-calc-100-20px--m","hl-v-arrow-next-top-position-calc-100-20px--t","hl-v-arrow-next-top-position-n25pct","hl-v-arrow-next-translate-x-100pct","hl-v-arrow-next-translate-y-0","hl-v-arrow-next-translate-y-0--t","hl-v-arrow-normal-color-ffffff","hl-v-arrow-prev-caption-spacing-0","hl-v-arrow-prev-caption-spacing-0--t","hl-v-arrow-prev-left-align-0pct","hl-v-arrow-prev-left-position-26pct--m","hl-v-arrow-prev-left-position-40pct--t","hl-v-arrow-prev-left-position-87pct","hl-v-arrow-prev-top-align-0pct","hl-v-arrow-prev-top-align-0pct--t","hl-v-arrow-prev-top-position-calc-100-20px--m","hl-v-arrow-prev-top-position-calc-100-20px--t","hl-v-arrow-prev-top-position-n25pct","hl-v-arrow-prev-translate-x-0","hl-v-arrow-prev-translate-y-0","hl-v-arrow-prev-translate-y-0--t","hl-v-arrow-size-18","hl-v-background-overlay---background-video-c0bda","hl-v-background-overlay---before","hl-v-background-overlay---hover-before","hl-v-border-bottom-width-1","hl-v-border-bottom-width-13","hl-v-border-bottom-width-2","hl-v-border-color-0165a1","hl-v-border-color-d5d5d5","hl-v-border-left-width-1","hl-v-border-left-width-2","hl-v-border-radius-0-0-0-0","hl-v-border-radius-20-20-20-20","hl-v-border-radius-5-5-5-5","hl-v-border-right-width-1","hl-v-border-right-width-2","hl-v-border-style-none","hl-v-border-style-solid","hl-v-border-top-width-1","hl-v-border-top-width-13","hl-v-border-top-width-2","hl-v-column-gap-0","hl-v-column-gap-1","hl-v-column-gap-10","hl-v-column-gap-12","hl-v-column-gap-14","hl-v-column-gap-16","hl-v-column-gap-25","hl-v-column-gap-30","hl-v-column-gap-35","hl-v-column-gap-4--m","hl-v-column-gap-45","hl-v-column-gap-5","hl-v-column-gap-60","hl-v-column-gap-8","hl-v-container-widget-flex-grow-0","hl-v-container-widget-flex-grow-0--m","hl-v-container-widget-flex-grow-0--t","hl-v-container-widget-flex-grow-1","hl-v-container-widget-width-100","hl-v-container-widget-width-100--t","hl-v-container-widget-width-100pct","hl-v-container-widget-width-100pct--m","hl-v-container-widget-width-111--m","hl-v-container-widget-width-113_923pct","hl-v-container-widget-width-116","hl-v-container-widget-width-130","hl-v-container-widget-width-136","hl-v-container-widget-width-237","hl-v-container-widget-width-23_352pct","hl-v-container-widget-width-246--m","hl-v-container-widget-width-289","hl-v-container-widget-width-300--m","hl-v-container-widget-width-307--m","hl-v-container-widget-width-331","hl-v-container-widget-width-373--t","hl-v-container-widget-width-37pct","hl-v-container-widget-width-429--t","hl-v-container-widget-width-51pct","hl-v-container-widget-width-55pct","hl-v-container-widget-width-59_25--m","hl-v-container-widget-width-62_97pct","hl-v-container-widget-width-721--t","hl-v-container-widget-width-75_906pct","hl-v-container-widget-width-80--m","hl-v-container-widget-width-88pct","hl-v-container-widget-width-95_063pct","hl-v-container-widget-width-96pct","hl-v-container-widget-width-calc-1-var-conta-3baaee","hl-v-container-widget-width-calc-1-var-conta-3baaee--m","hl-v-container-widget-width-calc-1-var-conta-3baaee--t","hl-v-container-widget-width-initial","hl-v-content-padding-20","hl-v-content-text-align-center","hl-v-content-text-align-left","hl-v-content-transition-duration-800ms","hl-v-content-width-100pct--d","hl-v-content-width-100vw--d","hl-v-content-width-1151--d","hl-v-content-width-1175--d","hl-v-content-width-1175--tb","hl-v-content-width-1400--d","hl-v-content-width-1520--d","hl-v-content-width-1557--d","hl-v-content-width-200--d","hl-v-content-width-500--m","hl-v-content-width-772--d","hl-v-content-width-850--d","hl-v-content-width-85vw--d","hl-v-content-width-95vw--tb","hl-v-display-flex","hl-v-display-grid","hl-v-divider-border-style-solid","hl-v-divider-border-width-1","hl-v-divider-border-width-4","hl-v-divider-border-width-5","hl-v-divider-color-0165a1","hl-v-divider-color-b6b6b6","hl-v-divider-color-b9b5b5","hl-v-divider-color-bfbfbf","hl-v-e-con-grid-template-columns-0-6fr-1-4fr","hl-v-e-con-grid-template-columns-0-95fr-3-05fr","hl-v-e-con-grid-template-columns-0-9fr-1-1fr","hl-v-e-con-grid-template-columns-1--m","hl-v-e-con-grid-template-columns-1--t","hl-v-e-con-grid-template-columns-1-1fr-0-9fr","hl-v-e-con-grid-template-columns-1-2fr-0-8fr","hl-v-e-con-grid-template-columns-1-5fr-0-8fr-1-1f-d95a00","hl-v-e-con-grid-template-columns-1fr","hl-v-e-con-grid-template-columns-1fr--m","hl-v-e-con-grid-template-columns-1fr-1fr","hl-v-e-con-grid-template-columns-1fr-2fr","hl-v-e-con-grid-template-columns-20px-1fr","hl-v-e-con-grid-template-columns-repeat-1-1fr--m","hl-v-e-con-grid-template-columns-repeat-1-1fr--t","hl-v-e-con-grid-template-columns-repeat-2-1fr","hl-v-e-con-grid-template-columns-repeat-3-1fr","hl-v-e-con-grid-template-columns-repeat-4-1fr--m","hl-v-e-con-grid-template-columns-repeat-5-1fr","hl-v-e-con-grid-template-rows-1fr","hl-v-e-con-grid-template-rows-1fr--m","hl-v-e-con-grid-template-rows-repeat-1-1fr","hl-v-e-con-grid-template-rows-repeat-1-1fr--m","hl-v-e-con-grid-template-rows-repeat-2-1fr","hl-v-e-icon-list-icon-size-14","hl-v-e-icon-list-icon-size-24","hl-v-e-icon-list-icon-size-6","hl-v-e-nav-menu-horizontal-menu-item-margin-calc-32px-2","hl-v-e-nav-menu-horizontal-menu-item-margin-calc-32px-2--m","hl-v-e-nav-menu-horizontal-menu-item-margin-calc-40px-2","hl-v-e-transform-origin-x-center--widget-container","hl-v-e-transform-origin-y-center--widget-container","hl-v-e-transform-scale-1--wc-hover","hl-v-e-transform-scale-1_2--wc-hover","hl-v-e-transform-translateX-15--wc-hover","hl-v-e-transform-translateX-n50pct--wc--m","hl-v-flex-direction-column","hl-v-flex-direction-row","hl-v-flex-grow-0--con","hl-v-flex-grow-0--el","hl-v-flex-grow-1--con","hl-v-flex-grow-1--el","hl-v-flex-grow-1--el--m","hl-v-flex-shrink-0--con","hl-v-flex-shrink-0--el","hl-v-flex-shrink-0--el--m","hl-v-flex-wrap-mobile-wrap","hl-v-flex-wrap-nowrap--m","hl-v-flex-wrap-wrap--m","hl-v-flex-wrap-wrap--t","hl-v-grid-auto-flow-row","hl-v-grid-auto-flow-row--m","hl-v-grid-auto-flow-row--t","hl-v-grid-column-gap-0","hl-v-grid-column-gap-30","hl-v-grid-row-gap-0","hl-v-grid-row-gap-30","hl-v-grid-template-columns-repeat-0-auto","hl-v-icon-padding-0_6em--social-icon","hl-v-icon-vertical-offset-0","hl-v-image-transition-duration-1000ms","hl-v-justify-content-center","hl-v-justify-content-center--m","hl-v-justify-content-center--t","hl-v-justify-content-flex-end","hl-v-justify-content-flex-start","hl-v-justify-content-flex-start--m","hl-v-justify-content-flex-start--t","hl-v-justify-content-space-between","hl-v-justify-items-center--m","hl-v-justify-items-start","hl-v-margin-bottom-0","hl-v-margin-bottom-0--m","hl-v-margin-bottom-0--t","hl-v-margin-bottom-10","hl-v-margin-bottom-10--m","hl-v-margin-bottom-15","hl-v-margin-bottom-19--m","hl-v-margin-bottom-20","hl-v-margin-bottom-35","hl-v-margin-bottom-40","hl-v-margin-bottom-40--m","hl-v-margin-bottom-45","hl-v-margin-bottom-5","hl-v-margin-bottom-50","hl-v-margin-bottom-n25","hl-v-margin-bottom-n38","hl-v-margin-left-0","hl-v-margin-left-0--m","hl-v-margin-left-0--t","hl-v-margin-right-0","hl-v-margin-right-0--m","hl-v-margin-right-0--t","hl-v-margin-top-0","hl-v-margin-top-0--m","hl-v-margin-top-0--t","hl-v-margin-top-110--m","hl-v-margin-top-15","hl-v-margin-top-45","hl-v-margin-top-55","hl-v-margin-top-73","hl-v-margin-top-80","hl-v-margin-top-n19","hl-v-margin-top-n27","hl-v-min-height-0--m","hl-v-min-height-100pct","hl-v-min-height-100vh","hl-v-min-height-100vh--m","hl-v-min-height-200","hl-v-min-height-200--t","hl-v-min-height-275","hl-v-min-height-4","hl-v-min-height-415","hl-v-min-height-415--m","hl-v-min-height-415--t","hl-v-min-height-430","hl-v-min-height-44","hl-v-min-height-50","hl-v-min-height-520","hl-v-min-height-650","hl-v-min-height-80--m","hl-v-min-height-90--m","hl-v-order-n99999--con--m","hl-v-order-n99999--el--m","hl-v-overlay-mix-blend-mode-multiply","hl-v-overlay-opacity-0_38","hl-v-overlay-opacity-0_5","hl-v-overlay-opacity-0_67--m","hl-v-overlay-opacity-0_7--hover","hl-v-overlay-transition-0_5s","hl-v-overlay-transition-0_5s--before","hl-v-overlay-transition-duration-800ms","hl-v-padding-bottom-0","hl-v-padding-bottom-0--m","hl-v-padding-bottom-0--t","hl-v-padding-bottom-0pct","hl-v-padding-bottom-0pct--t","hl-v-padding-bottom-10","hl-v-padding-bottom-10--m","hl-v-padding-bottom-15","hl-v-padding-bottom-15--m","hl-v-padding-bottom-15--t","hl-v-padding-bottom-16","hl-v-padding-bottom-17","hl-v-padding-bottom-18","hl-v-padding-bottom-20","hl-v-padding-bottom-20--m","hl-v-padding-bottom-200--m","hl-v-padding-bottom-21--t","hl-v-padding-bottom-25","hl-v-padding-bottom-25--m","hl-v-padding-bottom-26","hl-v-padding-bottom-30","hl-v-padding-bottom-30--m","hl-v-padding-bottom-30--t","hl-v-padding-bottom-300--m","hl-v-padding-bottom-306--t","hl-v-padding-bottom-36--m","hl-v-padding-bottom-37--m","hl-v-padding-bottom-40","hl-v-padding-bottom-40--m","hl-v-padding-bottom-40--t","hl-v-padding-bottom-400--m","hl-v-padding-bottom-400--t","hl-v-padding-bottom-43","hl-v-padding-bottom-45","hl-v-padding-bottom-5","hl-v-padding-bottom-5--m","hl-v-padding-bottom-50","hl-v-padding-bottom-50--m","hl-v-padding-bottom-50--t","hl-v-padding-bottom-60","hl-v-padding-bottom-60--m","hl-v-padding-bottom-65","hl-v-padding-bottom-70","hl-v-padding-bottom-80","hl-v-padding-bottom-90","hl-v-padding-bottom-90--m","hl-v-padding-bottom-90--t","hl-v-padding-left-0","hl-v-padding-left-0--m","hl-v-padding-left-0--t","hl-v-padding-left-016","hl-v-padding-left-10","hl-v-padding-left-10--m","hl-v-padding-left-10--t","hl-v-padding-left-15","hl-v-padding-left-15--m","hl-v-padding-left-15--t","hl-v-padding-left-20","hl-v-padding-left-20--m","hl-v-padding-left-20--t","hl-v-padding-left-25","hl-v-padding-left-30","hl-v-padding-left-3pct--t","hl-v-padding-left-40","hl-v-padding-left-5--m","hl-v-padding-left-6--m","hl-v-padding-left-70","hl-v-padding-left-70--t","hl-v-padding-left-7pct","hl-v-padding-right-0","hl-v-padding-right-0--m","hl-v-padding-right-0--t","hl-v-padding-right-10","hl-v-padding-right-10--m","hl-v-padding-right-10--t","hl-v-padding-right-15","hl-v-padding-right-15--m","hl-v-padding-right-15--t","hl-v-padding-right-20","hl-v-padding-right-20--m","hl-v-padding-right-20--t","hl-v-padding-right-25","hl-v-padding-right-30","hl-v-padding-right-3pct--t","hl-v-padding-right-40","hl-v-padding-right-5--m","hl-v-padding-right-6--m","hl-v-padding-right-70","hl-v-padding-right-70--t","hl-v-padding-right-7pct","hl-v-padding-top-0","hl-v-padding-top-0--m","hl-v-padding-top-0--t","hl-v-padding-top-040","hl-v-padding-top-0pct","hl-v-padding-top-0pct--t","hl-v-padding-top-10","hl-v-padding-top-10--t","hl-v-padding-top-100","hl-v-padding-top-110","hl-v-padding-top-120","hl-v-padding-top-15","hl-v-padding-top-15--m","hl-v-padding-top-15--t","hl-v-padding-top-16","hl-v-padding-top-17","hl-v-padding-top-18","hl-v-padding-top-20","hl-v-padding-top-22--t","hl-v-padding-top-25","hl-v-padding-top-25--m","hl-v-padding-top-30","hl-v-padding-top-30--t","hl-v-padding-top-31","hl-v-padding-top-33","hl-v-padding-top-40","hl-v-padding-top-40--m","hl-v-padding-top-48","hl-v-padding-top-5--m","hl-v-padding-top-50","hl-v-padding-top-50--m","hl-v-padding-top-50--t","hl-v-padding-top-60","hl-v-padding-top-60--m","hl-v-padding-top-66","hl-v-padding-top-67--t","hl-v-padding-top-70","hl-v-padding-top-70--t","hl-v-padding-top-80","hl-v-padding-top-85","hl-v-padding-top-90","hl-v-position-absolute","hl-v-position-fixed","hl-v-row-gap-0","hl-v-row-gap-1","hl-v-row-gap-10","hl-v-row-gap-12","hl-v-row-gap-14","hl-v-row-gap-15","hl-v-row-gap-16","hl-v-row-gap-20","hl-v-row-gap-25","hl-v-row-gap-30","hl-v-row-gap-35","hl-v-row-gap-4--m","hl-v-row-gap-45","hl-v-row-gap-5","hl-v-row-gap-60","hl-v-row-gap-8","hl-v-swiper-offset-size-0--m","hl-v-swiper-offset-size-0--t","hl-v-swiper-offset-size-210","hl-v-swiper-slides-gap-25","hl-v-swiper-slides-gap-35--t","hl-v-width-100_567pct--d","hl-v-width-100pct--d","hl-v-width-100pct--m","hl-v-width-100pct--tb","hl-v-width-167_672--tb","hl-v-width-188_672--tb","hl-v-width-242--m","hl-v-width-243--m","hl-v-width-264--d","hl-v-width-30pct--d","hl-v-width-316_672--tb","hl-v-width-32_977pct--d","hl-v-width-70pct--d","hl-v-width-80pct--d","hl-v-z-index-1","hl-v-z-index-10","hl-v-z-index-9","hl-v-z-index-98","hl-w-100pct","hl-w-100pct--img","hl-w-100pct--sep","hl-w-100pct--t","hl-w-116--img","hl-w-118--sep","hl-w-120--img--m","hl-w-120--img--t","hl-w-155--img--m","hl-w-165--img","hl-w-250--img","hl-w-300--img","hl-w-348--img","hl-w-350--img","hl-w-380--img","hl-w-500--img","hl-w-50pct--sep","hl-w-542--img","hl-w-75pct--img","hl-w-80pct--img--m","hl-w-93pct--img","hl-w-95pct--img","hl-w-95pct--sep","hl-w-auto","hl-w-initial","hl-w-var-container-wi-13928f--m","hl-w-var-container-wi-1d6d7d","hl-w-var-container-wi-26f3b7--m","hl-w-var-container-wi-42d50d","hl-w-var-container-wi-458a91--m","hl-w-var-container-wi-463737","hl-w-var-container-wi-50622d--m","hl-w-var-container-wi-61a229","hl-w-var-container-wi-63803c","hl-w-var-container-wi-66f143","hl-w-var-container-wi-66f143--m","hl-w-var-container-wi-6ce09b","hl-w-var-container-wi-710d30","hl-w-var-container-wi-786b54","hl-w-var-container-wi-8bb4a4--t","hl-w-var-container-wi-8f8430--m","hl-w-var-container-wi-8ff653--m","hl-w-var-container-wi-90295b","hl-w-var-container-wi-94ec8a--t","hl-w-var-container-wi-9cfc70--t","hl-w-var-container-wi-a3ccb7","hl-w-var-container-wi-a3ccb7--t","hl-w-var-container-wi-af35ec","hl-w-var-container-wi-b97c03","hl-w-var-container-wi-be5eab","hl-w-var-container-wi-c437d2","hl-w-var-container-wi-ccf502","hl-w-var-container-wi-e96f56","hl-w-var-container-wi-ece8eb","hl-z-0","hl-z-2","hl-z-99"]');

/***/ },

/***/ "./theme/editor/icons.json"
/*!*********************************!*\
  !*** ./theme/editor/icons.json ***!
  \*********************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('["<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fab-facebook\\" viewBox=\\"0 0 512 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fab-instagram\\" viewBox=\\"0 0 448 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fab-linkedin\\" viewBox=\\"0 0 448 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fab-x-twitter\\" viewBox=\\"0 0 512 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fab-telegram\\" viewBox=\\"0 0 496 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fas-map-marker-alt\\" viewBox=\\"0 0 384 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fas-phone-alt\\" viewBox=\\"0 0 512 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z\\"></path></svg>","<svg class=\\"e-font-icon-svg e-fas-plus\\" viewBox=\\"0 0 448 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z\\"></path></svg>","<svg class=\\"e-font-icon-svg e-fas-minus\\" viewBox=\\"0 0 448 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fas-home\\" viewBox=\\"0 0 576 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-far-address-card\\" viewBox=\\"0 0 576 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M528 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm0 400H48V80h480v352zM208 256c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm-89.6 128h179.2c12.4 0 22.4-8.6 22.4-19.2v-19.2c0-31.8-30.1-57.6-67.2-57.6-10.8 0-18.7 8-44.8 8-26.9 0-33.4-8-44.8-8-37.1 0-67.2 25.8-67.2 57.6v19.2c0 10.6 10 19.2 22.4 19.2zM360 320h112c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8H360c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8zm0-64h112c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8H360c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8zm0-64h112c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8H360c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fas-square-full\\" viewBox=\\"0 0 512 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M512 512H0V0h512v512z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-far-building\\" viewBox=\\"0 0 448 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M128 148v-40c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12zm140 12h40c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12zm-128 96h40c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12zm128 0h40c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12zm-76 84v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12zm76 12h40c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12zm180 124v36H0v-36c0-6.6 5.4-12 12-12h19.5V24c0-13.3 10.7-24 24-24h337c13.3 0 24 10.7 24 24v440H436c6.6 0 12 5.4 12 12zM79.5 463H192v-67c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v67h112.5V49L80 48l-.5 415z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-far-circle\\" viewBox=\\"0 0 512 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fas-photo-video\\" viewBox=\\"0 0 640 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M608 0H160a32 32 0 0 0-32 32v96h160V64h192v320h128a32 32 0 0 0 32-32V32a32 32 0 0 0-32-32zM232 103a9 9 0 0 1-9 9h-30a9 9 0 0 1-9-9V73a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9zm352 208a9 9 0 0 1-9 9h-30a9 9 0 0 1-9-9v-30a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9zm0-104a9 9 0 0 1-9 9h-30a9 9 0 0 1-9-9v-30a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9zm0-104a9 9 0 0 1-9 9h-30a9 9 0 0 1-9-9V73a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9zm-168 57H32a32 32 0 0 0-32 32v288a32 32 0 0 0 32 32h384a32 32 0 0 0 32-32V192a32 32 0 0 0-32-32zM96 224a32 32 0 1 1-32 32 32 32 0 0 1 32-32zm288 224H64v-32l64-64 32 32 128-128 96 96z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fas-question\\" viewBox=\\"0 0 384 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M202.021 0C122.202 0 70.503 32.703 29.914 91.026c-7.363 10.58-5.093 25.086 5.178 32.874l43.138 32.709c10.373 7.865 25.132 6.026 33.253-4.148 25.049-31.381 43.63-49.449 82.757-49.449 30.764 0 68.816 19.799 68.816 49.631 0 22.552-18.617 34.134-48.993 51.164-35.423 19.86-82.299 44.576-82.299 106.405V320c0 13.255 10.745 24 24 24h72.471c13.255 0 24-10.745 24-24v-5.773c0-42.86 125.268-44.645 125.268-160.627C377.504 66.256 286.902 0 202.021 0zM192 373.459c-38.196 0-69.271 31.075-69.271 69.271 0 38.195 31.075 69.27 69.271 69.27s69.271-31.075 69.271-69.271-31.075-69.27-69.271-69.27z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fas-sitemap\\" viewBox=\\"0 0 640 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M128 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm-24-80h192v48h48v-48h192v48h48v-57.59c0-21.17-17.23-38.41-38.41-38.41H344v-64h40c17.67 0 32-14.33 32-32V32c0-17.67-14.33-32-32-32H256c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h40v64H94.41C73.23 224 56 241.23 56 262.41V320h48v-48zm264 80h-96c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm240 0h-96c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32z\\"></path></svg>","<svg aria-hidden=\\"true\\" class=\\"e-font-icon-svg e-fas-address-book\\" viewBox=\\"0 0 448 512\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M436 160c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12h-20V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h320c26.5 0 48-21.5 48-48v-48h20c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12h-20v-64h20c6.6 0 12-5.4 12-12v-40c0-6.6-5.4-12-12-12h-20v-64h20zm-228-32c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm112 236.8c0 10.6-10 19.2-22.4 19.2H118.4C106 384 96 375.4 96 364.8v-19.2c0-31.8 30.1-57.6 67.2-57.6h5c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h5c37.1 0 67.2 25.8 67.2 57.6v19.2z\\"></path></svg>"]');

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = (module) => {
/******/ 		const getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__webpack_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	// define getter/value functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	__webpack_require__.o = (obj, prop) => (Object.hasOwn(obj, prop));
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./theme/editor/index.js ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _ui_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ui.css */ "./theme/editor/ui.css");
/* harmony import */ var _paragraph_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./paragraph-data */ "./theme/editor/paragraph-data.js");
/* harmony import */ var _design_classes__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./design-classes */ "./theme/editor/design-classes.js");
/* harmony import */ var _page__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./page */ "./theme/editor/page.js");
/* harmony import */ var _blocks_accordion_block_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../blocks/accordion/block.json */ "./theme/blocks/accordion/block.json");
/* harmony import */ var _blocks_accordion_edit__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../blocks/accordion/edit */ "./theme/blocks/accordion/edit.js");
/* harmony import */ var _blocks_accordion_item_block_json__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../blocks/accordion-item/block.json */ "./theme/blocks/accordion-item/block.json");
/* harmony import */ var _blocks_accordion_item_edit__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../blocks/accordion-item/edit */ "./theme/blocks/accordion-item/edit.js");
/* harmony import */ var _blocks_box_block_json__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../blocks/box/block.json */ "./theme/blocks/box/block.json");
/* harmony import */ var _blocks_box_edit__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../blocks/box/edit */ "./theme/blocks/box/edit.js");
/* harmony import */ var _blocks_button_block_json__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../blocks/button/block.json */ "./theme/blocks/button/block.json");
/* harmony import */ var _blocks_button_edit__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../blocks/button/edit */ "./theme/blocks/button/edit.js");
/* harmony import */ var _blocks_container_block_json__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../blocks/container/block.json */ "./theme/blocks/container/block.json");
/* harmony import */ var _blocks_container_edit__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../blocks/container/edit */ "./theme/blocks/container/edit.js");
/* harmony import */ var _blocks_divider_block_json__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../blocks/divider/block.json */ "./theme/blocks/divider/block.json");
/* harmony import */ var _blocks_divider_edit__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../blocks/divider/edit */ "./theme/blocks/divider/edit.js");
/* harmony import */ var _blocks_document_block_json__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../blocks/document/block.json */ "./theme/blocks/document/block.json");
/* harmony import */ var _blocks_document_edit__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../blocks/document/edit */ "./theme/blocks/document/edit.js");
/* harmony import */ var _blocks_gallery_block_json__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../blocks/gallery/block.json */ "./theme/blocks/gallery/block.json");
/* harmony import */ var _blocks_gallery_edit__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ../blocks/gallery/edit */ "./theme/blocks/gallery/edit.js");
/* harmony import */ var _blocks_heading_block_json__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ../blocks/heading/block.json */ "./theme/blocks/heading/block.json");
/* harmony import */ var _blocks_heading_edit__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ../blocks/heading/edit */ "./theme/blocks/heading/edit.js");
/* harmony import */ var _blocks_html_block_json__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ../blocks/html/block.json */ "./theme/blocks/html/block.json");
/* harmony import */ var _blocks_html_edit__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ../blocks/html/edit */ "./theme/blocks/html/edit.js");
/* harmony import */ var _blocks_icon_block_json__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ../blocks/icon/block.json */ "./theme/blocks/icon/block.json");
/* harmony import */ var _blocks_icon_edit__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ../blocks/icon/edit */ "./theme/blocks/icon/edit.js");
/* harmony import */ var _blocks_icon_list_block_json__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ../blocks/icon-list/block.json */ "./theme/blocks/icon-list/block.json");
/* harmony import */ var _blocks_icon_list_edit__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ../blocks/icon-list/edit */ "./theme/blocks/icon-list/edit.js");
/* harmony import */ var _blocks_image_block_json__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ../blocks/image/block.json */ "./theme/blocks/image/block.json");
/* harmony import */ var _blocks_image_edit__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ../blocks/image/edit */ "./theme/blocks/image/edit.js");
/* harmony import */ var _blocks_loop_block_json__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ../blocks/loop/block.json */ "./theme/blocks/loop/block.json");
/* harmony import */ var _blocks_markup_block_json__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ../blocks/markup/block.json */ "./theme/blocks/markup/block.json");
/* harmony import */ var _blocks_markup_edit__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! ../blocks/markup/edit */ "./theme/blocks/markup/edit.js");
/* harmony import */ var _blocks_loop_edit__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! ../blocks/loop/edit */ "./theme/blocks/loop/edit.js");
/* harmony import */ var _blocks_nav_menu_block_json__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(/*! ../blocks/nav-menu/block.json */ "./theme/blocks/nav-menu/block.json");
/* harmony import */ var _blocks_nav_menu_edit__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(/*! ../blocks/nav-menu/edit */ "./theme/blocks/nav-menu/edit.js");
/* harmony import */ var _blocks_post_content_block_json__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(/*! ../blocks/post-content/block.json */ "./theme/blocks/post-content/block.json");
/* harmony import */ var _blocks_post_content_edit__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(/*! ../blocks/post-content/edit */ "./theme/blocks/post-content/edit.js");
/* harmony import */ var _blocks_shortcode_block_json__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__(/*! ../blocks/shortcode/block.json */ "./theme/blocks/shortcode/block.json");
/* harmony import */ var _blocks_shortcode_edit__WEBPACK_IMPORTED_MODULE_41__ = __webpack_require__(/*! ../blocks/shortcode/edit */ "./theme/blocks/shortcode/edit.js");
/* harmony import */ var _blocks_site_part_block_json__WEBPACK_IMPORTED_MODULE_42__ = __webpack_require__(/*! ../blocks/site-part/block.json */ "./theme/blocks/site-part/block.json");
/* harmony import */ var _blocks_site_part_edit__WEBPACK_IMPORTED_MODULE_43__ = __webpack_require__(/*! ../blocks/site-part/edit */ "./theme/blocks/site-part/edit.js");
/* harmony import */ var _blocks_social_icons_block_json__WEBPACK_IMPORTED_MODULE_44__ = __webpack_require__(/*! ../blocks/social-icons/block.json */ "./theme/blocks/social-icons/block.json");
/* harmony import */ var _blocks_social_icons_edit__WEBPACK_IMPORTED_MODULE_45__ = __webpack_require__(/*! ../blocks/social-icons/edit */ "./theme/blocks/social-icons/edit.js");
/* harmony import */ var _blocks_template_block_json__WEBPACK_IMPORTED_MODULE_46__ = __webpack_require__(/*! ../blocks/template/block.json */ "./theme/blocks/template/block.json");
/* harmony import */ var _blocks_template_edit__WEBPACK_IMPORTED_MODULE_47__ = __webpack_require__(/*! ../blocks/template/edit */ "./theme/blocks/template/edit.js");
/* harmony import */ var _blocks_text_block_json__WEBPACK_IMPORTED_MODULE_48__ = __webpack_require__(/*! ../blocks/text/block.json */ "./theme/blocks/text/block.json");
/* harmony import */ var _blocks_text_edit__WEBPACK_IMPORTED_MODULE_49__ = __webpack_require__(/*! ../blocks/text/edit */ "./theme/blocks/text/edit.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_50__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_50___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_50__);
/**
 * The theme's blocks in the editor: each block's edit view prints the same elements as its
 * includes/sections/ file, so the canvas is styled by the page's own rules, with the words
 * typed in place. Built with wp-scripts into theme/build/ (committed: nothing to build for
 * whoever installs the theme).
 */



















































// The blocks that hold other blocks save them; the rest are printed by the server.

const inner = () => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_50__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__.InnerBlocks.Content, {});
const none = () => null;
[[_blocks_accordion_block_json__WEBPACK_IMPORTED_MODULE_6__, _blocks_accordion_edit__WEBPACK_IMPORTED_MODULE_7__["default"], inner], [_blocks_accordion_item_block_json__WEBPACK_IMPORTED_MODULE_8__, _blocks_accordion_item_edit__WEBPACK_IMPORTED_MODULE_9__["default"], inner], [_blocks_box_block_json__WEBPACK_IMPORTED_MODULE_10__, _blocks_box_edit__WEBPACK_IMPORTED_MODULE_11__["default"], inner], [_blocks_button_block_json__WEBPACK_IMPORTED_MODULE_12__, _blocks_button_edit__WEBPACK_IMPORTED_MODULE_13__["default"], none], [_blocks_container_block_json__WEBPACK_IMPORTED_MODULE_14__, _blocks_container_edit__WEBPACK_IMPORTED_MODULE_15__["default"], inner], [_blocks_divider_block_json__WEBPACK_IMPORTED_MODULE_16__, _blocks_divider_edit__WEBPACK_IMPORTED_MODULE_17__["default"], none], [_blocks_document_block_json__WEBPACK_IMPORTED_MODULE_18__, _blocks_document_edit__WEBPACK_IMPORTED_MODULE_19__["default"], inner], [_blocks_gallery_block_json__WEBPACK_IMPORTED_MODULE_20__, _blocks_gallery_edit__WEBPACK_IMPORTED_MODULE_21__["default"], none], [_blocks_heading_block_json__WEBPACK_IMPORTED_MODULE_22__, _blocks_heading_edit__WEBPACK_IMPORTED_MODULE_23__["default"], none], [_blocks_html_block_json__WEBPACK_IMPORTED_MODULE_24__, _blocks_html_edit__WEBPACK_IMPORTED_MODULE_25__["default"], none], [_blocks_icon_block_json__WEBPACK_IMPORTED_MODULE_26__, _blocks_icon_edit__WEBPACK_IMPORTED_MODULE_27__["default"], none], [_blocks_icon_list_block_json__WEBPACK_IMPORTED_MODULE_28__, _blocks_icon_list_edit__WEBPACK_IMPORTED_MODULE_29__["default"], none], [_blocks_image_block_json__WEBPACK_IMPORTED_MODULE_30__, _blocks_image_edit__WEBPACK_IMPORTED_MODULE_31__["default"], none], [_blocks_loop_block_json__WEBPACK_IMPORTED_MODULE_32__, _blocks_loop_edit__WEBPACK_IMPORTED_MODULE_35__["default"], none], [_blocks_markup_block_json__WEBPACK_IMPORTED_MODULE_33__, _blocks_markup_edit__WEBPACK_IMPORTED_MODULE_34__["default"], none], [_blocks_nav_menu_block_json__WEBPACK_IMPORTED_MODULE_36__, _blocks_nav_menu_edit__WEBPACK_IMPORTED_MODULE_37__["default"], none], [_blocks_post_content_block_json__WEBPACK_IMPORTED_MODULE_38__, _blocks_post_content_edit__WEBPACK_IMPORTED_MODULE_39__["default"], none], [_blocks_shortcode_block_json__WEBPACK_IMPORTED_MODULE_40__, _blocks_shortcode_edit__WEBPACK_IMPORTED_MODULE_41__["default"], none], [_blocks_site_part_block_json__WEBPACK_IMPORTED_MODULE_42__, _blocks_site_part_edit__WEBPACK_IMPORTED_MODULE_43__["default"], none], [_blocks_social_icons_block_json__WEBPACK_IMPORTED_MODULE_44__, _blocks_social_icons_edit__WEBPACK_IMPORTED_MODULE_45__["default"], none], [_blocks_template_block_json__WEBPACK_IMPORTED_MODULE_46__, _blocks_template_edit__WEBPACK_IMPORTED_MODULE_47__["default"], inner], [_blocks_text_block_json__WEBPACK_IMPORTED_MODULE_48__, _blocks_text_edit__WEBPACK_IMPORTED_MODULE_49__["default"], inner]].forEach(([metadata, edit, save]) => (0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__.registerBlockType)(metadata, {
  edit,
  save
}));
})();

/******/ })()
;
//# sourceMappingURL=index.js.map