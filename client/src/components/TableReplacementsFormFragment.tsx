/* eslint-disable react/no-array-index-key */

import cloneDeep from 'lodash/cloneDeep';
import { FieldArray } from 'formik';
import FormField from 'components/FormField';
import { TableReplacement } from 'src/types';

const TABLE_REPLACEMENTS = 'tableReplacements';
const TEXT_REPLACEMENTS = 'textReplacements';
const ROWS = 'rows';

interface TableReplacementsFormFragmentProps {
  tableReplacements: TableReplacement[];
}

const getTableKey = (index: number) => `${TABLE_REPLACEMENTS}[${index}]`;
const getRowsKey = (index: number) => `${getTableKey(index)}.${ROWS}`;
const getRowKey = (tableIndex: number, rowIndex: number) => `${getRowsKey(tableIndex)}[${rowIndex}]`;
const getFieldName = (
  tableIndex: number,
  rowIndex: number,
  replacementName: string,
) => `${getRowKey(tableIndex, rowIndex)}.${TEXT_REPLACEMENTS}.${replacementName}`;

const TableReplacementsFormFragment = (
  { tableReplacements }: TableReplacementsFormFragmentProps,
) => {
  return (
    <FieldArray name={TABLE_REPLACEMENTS}>
      {
        () => {
          return (
            <div>
              {
                tableReplacements.map((table, i) => (
                  table && (
                    <div
                      key={getTableKey(i)}
                      style={{ margin: '10px', padding: '10px' }}
                    >
                      {`Table ${i + 1}`}
                      <FieldArray
                        key={getRowsKey(i)}
                        name={getRowsKey(i)}
                      >
                        {
                          ({
                            insert,
                            remove,
                            move,
                          }) => {
                            return (
                              <div>
                                {table.rows.map((row, j) => (
                                  <div key={getRowKey(i, j)}>
                                    {`Row ${j + 1}`}
                                    {
                                      Object.keys(row[TEXT_REPLACEMENTS]).map((name) => (
                                        <div key={getFieldName(i, j, name)}>
                                          <FormField
                                            label={name}
                                            name={getFieldName(i, j, name)}
                                            isLabelVisible
                                          />
                                        </div>
                                      ))
                                    }
                                    <button
                                      type="button"
                                      onClick={() => remove(j)}
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => insert(j, cloneDeep(row))}
                                    >
                                      +
                                    </button>
                                    {
                                      j > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => move(j, j - 1)}
                                        >
                                          ↑
                                        </button>
                                      )
                                    }
                                    {
                                      j < table.rows.length - 1 && (
                                        <button
                                          type="button"
                                          onClick={() => move(j, j + 1)}
                                        >
                                          ↓
                                        </button>
                                      )
                                    }
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        }
                      </FieldArray>
                    </div>
                  )
                ))
              }
            </div>
          );
        }
      }
    </FieldArray>
  );
};

export default TableReplacementsFormFragment;
