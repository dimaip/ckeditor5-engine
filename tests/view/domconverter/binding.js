/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals document */

import ViewElement from '../../../src/view/element';
import ViewSelection from '../../../src/view/selection';
import ViewRange from '../../../src/view/range';
import DomConverter from '../../../src/view/domconverter';
import ViewDocumentFragment from '../../../src/view/documentfragment';
import { INLINE_FILLER } from '../../../src/view/filler';

import { parse } from '../../../src/dev-utils/view';

import createElement from '@ckeditor/ckeditor5-utils/src/dom/createelement';

describe( 'DomConverter', () => {
	let converter;

	before( () => {
		converter = new DomConverter();
	} );

	describe( 'bindElements()', () => {
		it( 'should bind elements', () => {
			const domElement = document.createElement( 'p' );
			const viewElement = new ViewElement( 'p' );

			converter.bindElements( domElement, viewElement );

			expect( converter.getCorrespondingView( domElement ) ).to.equal( viewElement );
			expect( converter.mapViewToDom( viewElement ) ).to.equal( domElement );
		} );
	} );

	describe( 'bindDocumentFragments()', () => {
		it( 'should bind document fragments', () => {
			const domFragment = document.createDocumentFragment();
			const viewFragment = new ViewDocumentFragment();

			converter.bindDocumentFragments( domFragment, viewFragment );

			expect( converter.getCorrespondingView( domFragment ) ).to.equal( viewFragment );
			expect( converter.mapViewToDom( viewFragment ) ).to.equal( domFragment );
		} );
	} );

	describe( 'getCorrespondingView()', () => {
		it( 'should return corresponding view element if element is passed', () => {
			const domElement = document.createElement( 'p' );
			const viewElement = new ViewElement( 'p' );

			converter.bindElements( domElement, viewElement );

			expect( converter.getCorrespondingView( domElement ) ).to.equal( viewElement );
		} );

		it( 'should return corresponding view text if text is passed', () => {
			const domText = document.createTextNode( 'foo' );
			const domP = document.createElement( 'p' );

			domP.appendChild( domText );

			const viewP = converter.domToView( domP );
			const viewText = viewP.getChild( 0 );

			converter.bindElements( domP, viewP );

			expect( converter.getCorrespondingView( domText ) ).to.equal( viewText );
		} );

		it( 'should return corresponding view document fragment', () => {
			const domFragment = document.createDocumentFragment();
			const viewFragment = converter.domToView( domFragment );

			converter.bindElements( domFragment, viewFragment );

			expect( converter.getCorrespondingView( domFragment ) ).to.equal( viewFragment );
		} );

		it( 'should return null if falsy value was passed', () => {
			expect( converter.getCorrespondingView( null ) ).to.be.null;
			expect( converter.getCorrespondingView( undefined ) ).to.be.null;
		} );
	} );

	describe( 'getCorrespondingViewElement()', () => {
		it( 'should return corresponding view element', () => {
			const domElement = document.createElement( 'p' );
			const viewElement = new ViewElement( 'p' );

			converter.bindElements( domElement, viewElement );

			expect( converter.getCorrespondingViewElement( domElement ) ).to.equal( viewElement );
		} );
	} );

	describe( 'getCorrespondingViewDocumentFragment()', () => {
		it( 'should return corresponding view document fragment', () => {
			const domFragment = document.createDocumentFragment();
			const viewFragment = converter.domToView( domFragment );

			converter.bindElements( domFragment, viewFragment );

			expect( converter.getCorrespondingViewDocumentFragment( domFragment ) ).to.equal( viewFragment );
		} );
	} );

	describe( 'getCorrespondingViewText()', () => {
		it( 'should return corresponding view text based on sibling', () => {
			const domImg = document.createElement( 'img' );
			const domText = document.createTextNode( 'foo' );
			const domP = createElement( document, 'p', null, [ domImg, domText ] );

			const viewImg = new ViewElement( 'img' );

			converter.bindElements( domImg, viewImg );

			const viewP = converter.domToView( domP );
			const viewText = viewP.getChild( 1 );

			expect( converter.getCorrespondingViewText( domText ) ).to.equal( viewText );
		} );

		it( 'should return corresponding view text based on parent', () => {
			const domText = document.createTextNode( 'foo' );
			const domP = createElement( document, 'p', null, domText );

			const viewP = converter.domToView( domP );
			const viewText = viewP.getChild( 0 );

			converter.bindElements( domP, viewP );

			expect( converter.getCorrespondingViewText( domText ) ).to.equal( viewText );
		} );

		it( 'should return null if sibling is not bound', () => {
			const domImg = document.createElement( 'img' );
			const domText = document.createTextNode( 'foo' );
			const domP = createElement( document, 'p', null, [ domImg, domText ] );

			const viewP = converter.domToView( domP );

			converter.bindElements( domP, viewP );

			expect( converter.getCorrespondingViewText( domText ) ).to.be.null;
		} );

		it( 'should return null if sibling is not element', () => {
			const domTextFoo = document.createTextNode( 'foo' );
			const domTextBar = document.createTextNode( 'bar' );
			const domP = createElement( document, 'p', null, [ domTextFoo, domTextBar ] );

			const viewP = converter.domToView( domP );

			converter.bindElements( domP, viewP );

			expect( converter.getCorrespondingViewText( domTextBar ) ).to.be.null;
		} );

		it( 'should return null if parent is not bound', () => {
			const domText = document.createTextNode( 'foo' );
			createElement( document, 'p', null, domText );

			expect( converter.getCorrespondingViewText( domText ) ).to.be.null;
		} );

		it( 'should return null for inline filler', () => {
			const domFiller = document.createTextNode( INLINE_FILLER );
			const domP = createElement( document, 'p', null, domFiller );

			const viewP = converter.domToView( domP );

			converter.bindElements( domP, viewP );

			expect( converter.getCorrespondingViewText( domFiller ) ).to.be.null;
		} );

		it( 'should return null if there is no text node sibling in view', () => {
			const domB = document.createElement( 'b' );
			const domI = document.createElement( 'i' );
			const domText = document.createTextNode( 'x' );
			const domP = createElement( document, 'p', null, [ domB, domText, domI ] );

			const viewP = parse( '<p><b></b><i></i></p>' );
			const viewB = viewP.getChild( 0 );
			const viewI = viewP.getChild( 1 );

			converter.bindElements( domP, viewP );
			converter.bindElements( domI, viewI );
			converter.bindElements( domB, viewB );

			expect( converter.getCorrespondingViewText( domText ) ).to.be.null;
		} );

		it( 'should return null if there is no child text node in view', () => {
			const domText = document.createTextNode( 'x' );
			const domP = createElement( document, 'p', null, domText );

			const viewP = parse( '<p></p>' );

			converter.bindElements( domP, viewP );

			expect( converter.getCorrespondingViewText( domText ) ).to.be.null;
		} );
	} );

	describe( 'mapViewToDom()', () => {
		it( 'should return corresponding DOM element if element was passed', () => {
			const domElement = document.createElement( 'p' );
			const viewElement = new ViewElement( 'p' );

			converter.bindElements( domElement, viewElement );

			expect( converter.mapViewToDom( viewElement ) ).to.equal( domElement );
		} );

		it( 'should return corresponding DOM document fragment', () => {
			const domFragment = document.createDocumentFragment();
			const viewFragment = new ViewDocumentFragment();

			converter.bindElements( domFragment, viewFragment );

			expect( converter.mapViewToDom( viewFragment ) ).to.equal( domFragment );
		} );

		it( 'should return undefined if wrong parameter is passed', () => {
			expect( converter.mapViewToDom( null ) ).to.be.undefined;
		} );
	} );

	describe( 'findCorrespondingDomText()', () => {
		it( 'should return corresponding DOM text based on sibling', () => {
			const domImg = document.createElement( 'img' );
			const domText = document.createTextNode( 'foo' );
			const domP = document.createElement( 'p' );

			domP.appendChild( domImg );
			domP.appendChild( domText );

			const viewImg = new ViewElement( 'img' );

			converter.bindElements( domImg, viewImg );

			const viewP = converter.domToView( domP );
			const viewText = viewP.getChild( 1 );

			expect( converter.findCorrespondingDomText( viewText ) ).to.equal( domText );
		} );

		it( 'should return corresponding DOM text based on parent', () => {
			const domText = document.createTextNode( 'foo' );
			const domP = document.createElement( 'p' );

			domP.appendChild( domText );

			const viewP = converter.domToView( domP );
			const viewText = viewP.getChild( 0 );

			converter.bindElements( domP, viewP );

			expect( converter.findCorrespondingDomText( viewText ) ).to.equal( domText );
		} );

		it( 'should return null if sibling is not bound', () => {
			const domImg = document.createElement( 'img' );
			const domText = document.createTextNode( 'foo' );
			const domP = document.createElement( 'p' );

			domP.appendChild( domImg );
			domP.appendChild( domText );

			const viewP = converter.domToView( domP );
			const viewText = viewP.getChild( 1 );

			converter.bindElements( domP, viewP );

			expect( converter.findCorrespondingDomText( viewText ) ).to.be.null;
		} );

		it( 'should return null if parent is not bound', () => {
			const domText = document.createTextNode( 'foo' );
			const domP = document.createElement( 'p' );

			domP.appendChild( domText );

			const viewP = converter.domToView( domP );
			const viewText = viewP.getChild( 0 );

			expect( converter.findCorrespondingDomText( viewText ) ).to.be.null;
		} );

		it( 'should return null if there is no previous sibling and parent', () => {
			const domText = document.createTextNode( 'foo' );
			const viewText = converter.domToView( domText );

			expect( converter.findCorrespondingDomText( viewText ) ).to.be.null;
		} );
	} );

	describe( 'bindFakeSelection', () => {
		let domEl, selection, viewElement;

		beforeEach( () => {
			viewElement = new ViewElement();
			domEl = document.createElement( 'div' );
			selection = new ViewSelection();
			selection.addRange( ViewRange.createIn( viewElement ) );
			converter.bindFakeSelection( domEl, selection );
		} );

		it( 'should bind DOM element to selection', () => {
			const bindSelection = converter.fakeSelectionToView( domEl );
			expect( bindSelection ).to.be.defined;
			expect( bindSelection.isEqual( selection ) ).to.be.true;
		} );

		it( 'should keep a copy of selection', () => {
			const selectionCopy = ViewSelection.createFromSelection( selection );

			selection.addRange( ViewRange.createIn( new ViewElement() ), true );
			const bindSelection = converter.fakeSelectionToView( domEl );

			expect( bindSelection ).to.be.defined;
			expect( bindSelection ).to.not.equal( selection );
			expect( bindSelection.isEqual( selection ) ).to.be.false;
			expect( bindSelection.isEqual( selectionCopy ) ).to.be.true;
		} );
	} );

	describe( 'unbindDomElement', () => {
		it( 'should unbind elements', () => {
			const domElement = document.createElement( 'p' );
			const viewElement = new ViewElement( 'p' );

			converter.bindElements( domElement, viewElement );

			expect( converter.getCorrespondingView( domElement ) ).to.equal( viewElement );
			expect( converter.mapViewToDom( viewElement ) ).to.equal( domElement );

			converter.unbindDomElement( domElement );

			expect( converter.getCorrespondingView( domElement ) ).to.be.undefined;
			expect( converter.mapViewToDom( viewElement ) ).to.be.undefined;
		} );

		it( 'should unbind element\'s child nodes', () => {
			const domElement = document.createElement( 'p' );
			const domChild = document.createElement( 'span' );
			domElement.appendChild( domChild );

			const viewElement = new ViewElement( 'p' );
			const viewChild = new ViewElement( 'span' );

			converter.bindElements( domElement, viewElement );
			converter.bindElements( domChild, viewChild );

			expect( converter.getCorrespondingView( domChild ) ).to.equal( viewChild );
			expect( converter.mapViewToDom( viewChild ) ).to.equal( domChild );

			converter.unbindDomElement( domElement );

			expect( converter.getCorrespondingView( domChild ) ).to.be.undefined;
			expect( converter.mapViewToDom( viewChild ) ).to.be.undefined;
		} );

		it( 'should do nothing if there are no elements bind', () => {
			const domElement = document.createElement( 'p' );
			const viewElement = new ViewElement( 'p' );

			expect( converter.getCorrespondingView( domElement ) ).to.be.undefined;
			expect( converter.mapViewToDom( viewElement ) ).to.be.undefined;

			converter.unbindDomElement( domElement );

			expect( converter.getCorrespondingView( domElement ) ).to.be.undefined;
			expect( converter.mapViewToDom( viewElement ) ).to.be.undefined;
		} );
	} );
} );
