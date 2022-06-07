import { EditOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

/**
 * Render a table cell that links to the "Edit" page for a record.
 *
 * The record link is given by the function passed as an argument.
 */
export const EditLink =
  <T extends Record<string, any>>(link: (record: T) => string) =>
  (text: string, record: T) => {
    const WrappedEditLink = (
      <Link to={link(record)}>
        <EditOutlined />
      </Link>
    );
    return WrappedEditLink;
  };
