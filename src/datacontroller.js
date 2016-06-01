/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import Mapper from './conversion/mapper.js';

import ModelConversionDispatcher from './conversion/modelconversiondispatcher.js';
import { insertText } from './conversion/model-to-view-converters.js';

import ViewConversionDispatcher from './conversion/viewconversiondispatcher.js';
import { convertText, convertToModelFragment } from './conversion/view-to-model-converters.js';

import Writer from './view/writer.js';
import ViewDocumentFragment from './view/documentfragment.js';
import DomConverter from './view/domconverter.js';
import { NBSP_FILLER } from './view/filler.js';

import ModelRange from './model/range.js';
import ModelPosition from './model/position.js';

/**
 * Controller for the data pipeline. The data pipeline controls how data is retrieved from the document
 * and set inside it. Hence, the controller features two methods which allow to {@link engine.DataController#get get}
 * and {@link engine.DataController#set set} data of the {@link engine.DataController#model model}
 * using given:
 *
 * * {@link engine.dataProcessor.DataProcessor data processor},
 * * {@link engine.conversion.ModelConversionDispatcher model to view} and
 * {@link engine.conversion.ViewConversionDispatcher view to model} converters.
 *
 * @memberOf engine
 */
export default class DataController {
	/**
	 * Creates data controller instance.
	 *
	 * @param {engine.model.Document} model Document model.
	 * @param {engine.dataProcessor.DataProcessor} [dataProcessor] Data processor which should used by the controller.
	 */
	constructor( model, dataProcessor ) {
		/**
		 * Document model.
		 *
		 * @readonly
		 * @member {engine.model.document} engine.DataController#model
		 */
		this.model = model;

		/**
		 * Data processor used during the conversion.
		 *
		 * @readonly
		 * @member {engine.dataProcessor.DataProcessor} engine.DataController#processor
		 */
		this.processor = dataProcessor;

		/**
		 * Mapper used for the conversion. It has no permanent bindings, because they are created when getting data and
		 * cleared directly after data are converted. However, the mapper is defined as class property, because
		 * it needs to be passed to the `ModelConversionDispatcher` as a conversion API.
		 *
		 * @private
		 * @member {engine.conversion.Mapper} engine.DataController#_mapper
		 */
		this._mapper = new Mapper();

		/**
		 * Writer used during the conversion.
		 *
		 * @private
		 * @member {engine.view.Writer} engine.DataController#_writer
		 */
		this._writer = new Writer();

		/**
		 * DOM converter used during the conversion.
		 *
		 * @private
		 * @member {engine.view.DomConverter} engine.DataController#_domConverter
		 */
		this._domConverter = new DomConverter( { blockFiller: NBSP_FILLER } );

		/**
		 * Model to view conversion dispatcher used by the {@link engine.DataController#get get method}.
		 * To attach model to view converter to the data pipeline you need to add lister to this property:
		 *
		 *		data.modelToView( 'insert:$element', customInsertConverter );
		 *
		 * Or use {@link engine.conversion.ModelConverterBuilder}:
		 *
		 *		BuildModelConverterFor( data.modelToView ).fromAttribute( 'bold' ).toElement( 'b' );
		 *
		 * @readonly
		 * @member {engine.conversion.ModelConversionDispatcher} engine.DataController#modelToView
		 */
		this.modelToView = new ModelConversionDispatcher( {
			writer: this._writer,
			mapper: this._mapper
		} );
		this.modelToView.on( 'insert:$text', insertText() );

		/**
		 * View to model conversion dispatcher used by the {@link engine.DataController#set set method}.
		 * To attach view to model converter to the data pipeline you need to add lister to this property:
		 *
		 *		data.viewToModel( 'element', customElementConverter );
		 *
		 * Or use {@link engine.conversion.ViewConverterBuilder}:
		 *
		 *		BuildViewConverterFor( data.viewToModel ).fromElement( 'b' ).toAttribute( 'bold', 'true' );
		 *
		 * @readonly
		 * @member {engine.conversion.ViewConversionDispatcher} engine.DataController#viewToModel
		 */
		this.viewToModel = new ViewConversionDispatcher( {
			schema: model.schema
		} );

		// Define default converters for text and elements.
		//
		// Note that if there is no default converter for the element it will be skipped, for instance `<b>foo</b>` will be
		// converted to nothing. We add `convertToModelFragment` as a last converter so it converts children of that
		// element to the document fragment so `<b>foo</b>` will be converted to `foo` if there is no converter for `<b>`.
		this.viewToModel.on( 'text', convertText() );
		this.viewToModel.on( 'element', convertToModelFragment(), null, 9999 );
		this.viewToModel.on( 'documentFragment', convertToModelFragment(), null, 9999 );
	}

	/**
	 * Returns model's data converted by the {@link engine.DataController#modelToView model to view converters} and
	 * formatted by the {@link engine.DataController#processor data processor}.
	 *
	 * @param {String} [rootName='main'] Root name.
	 * @returns {String} Output data.
	 */
	get( rootName = 'main' ) {
		// Get model range.
		const modelRoot = this.model.getRoot( rootName );
		const modelRange = ModelRange.createFromElement( modelRoot );

		// model -> view.
		const viewDocumentFragment = new ViewDocumentFragment();
		this._mapper.bindElements( modelRoot, viewDocumentFragment );

		this.modelToView.convertInsert( modelRange );

		this._mapper.clearBindings();

		// view -> DOM.
		const domDocumentFragment = this._domConverter.viewToDom( viewDocumentFragment, document );

		// DOM -> data.
		return this.processor.toData( domDocumentFragment );
	}

	/**
	 * Sets input data parsed by the {@link engine.DataController#processor data processor} and
	 * converted by the {@link engine.DataController#viewToModel view to model converters}.
	 *
	 * This method also creates a batch with all the changes applied. If all you need is to parse data use
	 * the {@link engine.dataController#parse} method.
	 *
	 * @param {String} data Input data.
	 * @param {String} [rootName='main'] Root name.
	 */
	set( data, rootName = 'main' ) {
		// Save to model.
		const modelRoot = this.model.getRoot( rootName );

		this.model.enqueueChanges( () => {
			this.model.batch()
				.remove( ModelRange.createFromElement( modelRoot ) )
				.insert( ModelPosition.createAt( modelRoot, 0 ), this.parse( data ) );
		} );
	}

	/**
	 * Returns data parsed by the {@link engine.DataController#processor data processor} and then
	 * converted by the {@link engine.DataController#viewToModel view to model converters}.
	 *
	 * @see engine.DataController#set
	 * @param {String} data Data to parse.
	 * @returns {engine.model.DocumentFragment} Parsed data.
	 */
	parse( data ) {
		// data -> DOM.
		const domDocumentFragment = this.processor.toDom( data );

		// DOM -> view.
		const viewDocumentFragment = this._domConverter.domToView( domDocumentFragment );

		// view -> model.
		const modelDocumentFragment = this.viewToModel.convert( viewDocumentFragment, { context: [ '$root' ] } );

		return modelDocumentFragment;
	}

	/**
	 * Removes all event listeners set by the DataController.
	 */
	destroy() {}
}