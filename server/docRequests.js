/* eslint-disable max-classes-per-file */

const omit = require('lodash/omit');

const getFieldMask = (updates) => Object.keys(updates).join(',');

class Location {
  constructor(index) {
    this.segmentId = ''; // FIXME: empty string will only work inside doc body, not header/footer/footnote
    this.index = index;
  }
}

class Range {
  constructor(startIndex, endIndex) {
    this.startIndex = startIndex;
    this.endIndex = endIndex;
  }
}

class TableCellLocation {
  constructor(tableIndex, rowIndex, columnIndex) {
    this.tableStartLocation = new Location(tableIndex);
    this.rowIndex = rowIndex;
    this.columnIndex = columnIndex;
  }
}

module.exports = {
  ReplaceAllTextRequest: class ReplaceAllTextRequest {
    constructor(replaceText, text) {
      this.replaceAllText = {
        replaceText,
        containsText: {
          text,
          matchCase: true,
        },
      };
    }
  },

  InsertTableRowRequest: class InsertTableRowRequest {
    constructor(tableIndex, rowInsertionIndex) {
      this.insertTableRow = {
        tableCellLocation: new TableCellLocation(tableIndex, rowInsertionIndex, 0),
        insertBelow: true,
      };
    }
  },

  UpdateTableRowStyleRequest: class UpdateTableRowStyleRequest {
    constructor(tableIndex, rowIndices, tableRowStyle) {
      this.updateTableRowStyle = {
        tableStartLocation: new Location(tableIndex),
        rowIndices,
        tableRowStyle,
        fields: getFieldMask(tableRowStyle),
      };
    }
  },

  UpdateTableCellStyleRequest: class UpdateTableCellStyleRequest {
    constructor(tableIndex, rowIndex, columnIndex, tableCellStyle) {
      this.updateTableCellStyle = {
        tableRange: {
          tableCellLocation: new TableCellLocation(tableIndex, rowIndex, columnIndex),
          rowSpan: 1,
          columnSpan: 1,
        },
        tableCellStyle,
        fields: '*',
      };
    }
  },

  DeleteTableRowRequest: class DeleteTableRowRequest {
    constructor(tableIndex, rowIndex) {
      this.deleteTableRow = {
        tableCellLocation: new TableCellLocation(tableIndex, rowIndex, 0),
      };
    }
  },

  CreateParagraphBulletsRequest: class CreateParagraphBulletsRequest {
    constructor(startIndex, bulletPreset) {
      this.createParagraphBullets = {
        range: new Range(startIndex, startIndex + 1),
        bulletPreset,
      };
    }
  },

  UpdateParagraphStyleRequest: class UpdateParagraphStyleRequest {
    constructor(startIndex, paragraphStyle) {
      this.updateParagraphStyle = {
        range: new Range(startIndex, startIndex + 1),
        paragraphStyle,
        fields: getFieldMask(omit(paragraphStyle, 'pageBreakBefore')),
      };
    }
  },

  InsertTextRequest: class InsertTextRequest {
    constructor(text, index) {
      this.insertText = {
        text,
        location: new Location(index),
      };
    }
  },

  UpdateTextStyleRequest: class UpdateTextStyleRequest {
    constructor(startIndex, endIndex, textStyle) {
      this.updateTextStyle = {
        range: new Range(startIndex, endIndex),
        textStyle,
        fields: '*',
      };
    }
  },
};
