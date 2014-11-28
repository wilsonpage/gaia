define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var component = require('gaia-component');

/**
 * Exports
 */

module.exports = component.register('gaia-camera-grid', {
  created: function() {
    this.createShadowRoot().innerHTML = this.template;
  },

  template: `
    <div class="row"></div>
    <div class="row middle"></div>
    <div class="row"></div>
    <div class="column left">
      <div class="cell top"></div>
      <div class="cell middle"></div>
      <div class="cell bottom"></div>
    </div>
    <div class="column middle">
      <div class="cell top"></div>
      <div class="cell middle"></div>
      <div class="cell bottom"></div>
    </div>
    <div class="column right">
     <div class="cell top"></div>
     <div class="cell middle"></div>
     <div class="cell bottom"></div>
    </div>

    <style>

      :host {
        position: absolute;
        left: 0;
        top: 0;

        width: 100%;
        height: 100%;

        pointer-events: none;
      }

      :host[hidden] {
        display: none;
      }

      .row,
      .column {
        border: solid 0 rgba(255, 255, 255, 0.5);
      }

      * { box-sizing: border-box }

      /** Rows
       ---------------------------------------------------------*/

      .row {
        height: 33.33%;
      }

      .row.middle {
        border-top-width: 0.1rem;
        border-bottom-width: 0.1rem;
      }

      /** Columns
       ---------------------------------------------------------*/

      .column {
        position: absolute;
        left: 0; top: 0;
        height: 100%;
        width: 33.33%;
      }

      .column.middle {
        left: 33.33%;
        border-right-width: 0.1rem;
        border-left-width: 0.1rem;
      }

      .column.right{
        left: 66.66%;
      }

      /** Cells
       ---------------------------------------------------------*/

      .column .cell {
        width: 100%;
        border: solid 0.1rem rgba(0,0,0,0.2);
        margin-bottom: 0.1rem; /* To accomodate the grid between cells */
        height: 33.33%;
      }

      .column .cell.middle {
        /* To account for the border width of the grid */
        height: calc(33.33% - 0.2rem);
      }

      /* Removes unwanted cell borders along the edge of the preview */

      .column.left .cell.top,
      .column.middle .cell.top,
      .column.right .cell.top {
        border-top-width: 0;
      }

      .column.left .cell.top,
      .column.left .cell.middle,
      .column.left .cell.bottom {
        border-left-width: 0;
      }

      .column.right .cell.top,
      .column.right .cell.middle,
      .column.right .cell.bottom {
        border-right-width: 0;
      }

      .column.left .cell.bottom,
      .column.middle .cell.bottom,
      .column.right .cell.bottom {
        border-bottom-width: 0;
      }

    </style>`
});

});
