import {  Table,  TableHeader,  TableBody,  TableColumn,  TableRow,  TableCell, getKeyValue,} from "@heroui/react";
import { IResponseData } from "@/app/types";
import { prepareColumnsToTable } from "@/app/helpers/data";

interface IMainTable {
    rows: IResponseData[];
}

export default function MainTable({ rows }: IMainTable) {
    const columns = prepareColumnsToTable(rows[0])
    console.log(columns);
    console.log(rows);
    return (
      <Table className="dark" aria-label="Example table with dynamic content">
        <TableHeader columns={columns}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }
