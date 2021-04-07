import React, { useState } from "react";
import { Card } from "antd";
import "./AggregateDataEntryForm.css";

const AggregateDataEntryForm = (): JSX.Element => {
  const handleFocus = (event: { target: { value: string } }) => {
    event.target.value = "";
  };

  // TODO: set state for each entry

  return (
    <Card type="inner" title="Gender">
      <form>
        <label htmlFor="women">
          <input
            type="number"
            id="women"
            className="data-input-form_field"
            defaultValue="0"
            onFocus={handleFocus}
          />{" "}
          Women
        </label>

        <label htmlFor="men">
          <input
            type="number"
            id="men"
            className="data-input-form_field"
            defaultValue="0"
            onFocus={handleFocus}
          />{" "}
          Men
        </label>

        <label htmlFor="nonBinary">
          <input
            type="number"
            id="nonBinary"
            className="data-input-form_field"
            defaultValue="0"
            onFocus={handleFocus}
          />{" "}
          Non-binary
        </label>

        <label htmlFor="genderNonconforming">
          <input
            type="number"
            id="genderNonconforming"
            className="data-input-form_field"
            defaultValue="0"
            onFocus={handleFocus}
          />{" "}
          Gender non-conforming
        </label>

        <label htmlFor="cisgender">
          <input
            type="number"
            id="cisgender"
            className="data-input-form_field"
            defaultValue="0"
            onFocus={handleFocus}
          />{" "}
          Cisgender
        </label>

        <label htmlFor="transgender">
          <input
            type="number"
            id="transgender"
            className="data-input-form_field"
            defaultValue="0"
            onFocus={handleFocus}
          />{" "}
          Transgender
        </label>
      </form>
    </Card>
  );
};

export { AggregateDataEntryForm };
