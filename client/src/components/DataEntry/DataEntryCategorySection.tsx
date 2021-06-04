import { Card, Col } from "antd";
import React, { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Entry } from "./DataEntryAggregateDataEntryForm";

interface DataEntryCategorySection {
  entries: Entry[];
  onValueChange: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
}

const DataEntryCategorySection = ({
  entries,
  onValueChange,
}: DataEntryCategorySection): JSX.Element => {
  const { t } = useTranslation();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    onValueChange(event, index);
  };

  return (
    <>
      <Col span={8}>
        <h3 className="data-entry_category-descr-header">
          {t("aboutAttribute", { attribute: "Gender" })}
        </h3>
        {t("attributeDescription", {
          description: `Gender identity expresses one's innermost concept of self as male,
        female, a blend of both or neither - how individuals perceive
        themselves and what they call themselves. Someone's gender identity
        can be the same (cisgender) or different (transgender) from their
        sex assigned at birth.`,
        })}
      </Col>
      <Col span={16}>
        <Card type="inner" title="Gender">
          <div className="data-entry-form_input-grid">
            {entries.map((item, index) => (
              <label
                key={index}
                id={item.categoryValueLabel}
                htmlFor={item.categoryValue}
                className="data-entry-form_label"
              >
                <input
                  name={item.categoryValue}
                  required
                  aria-labelledby={item.categoryValueLabel}
                  aria-required="true"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={item.count}
                  onChange={(e) => handleChange(e, index)}
                />
                {` ${item.categoryValue} `}
                <span
                  className="data-entry-form_required-field"
                  aria-labelledby={item.categoryValueLabel}
                >
                  *
                </span>
              </label>
            ))}
          </div>
        </Card>
      </Col>
    </>
  );
};

export { DataEntryCategorySection };
