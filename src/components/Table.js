import React from 'react';
import ReactTable from 'react-table';
import { checkIfEmpty } from '../utils/util';
import 'react-table/react-table.css';

export default class Table extends React.Component {
  constructor(props) {
    super(props);
  }

  filterCaseInsensitive = (filter, row) => {
    const id = filter.pivotId || filter.id;
    let decision = true;
    if (!checkIfEmpty(row[id])) {
      decision = String(row[id])
        .toLowerCase()
        .includes(filter.value.toLowerCase());
    }

    if (checkIfEmpty(row[id])) return false;

    return decision;
  };

  render() {
    const { data, columns, showPagination, filterable } = this.props;
    return (
        <ReactTable
          columns={columns}
          data={data}
          defaultPageSize={10}
          showPagination={showPagination}
          className="-striped -highlight"
          filterable={filterable}
          defaultFilterMethod={(filter, row) => this.filterCaseInsensitive(filter, row)}
          showPageJump={false}
        />
    );
  }
}