import { Card, Col, Row } from "antd";
import React, { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { GroupBy } from "../../utils/";
import { Entry } from "./DataEntryAggregateDataEntryForm";

interface DataEntryCategorySection {
  entries: Entry[];
  onValueChange: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
}

const groupByCategory = (entries: Entry[]) => {
  const group = GroupBy(entries, (obj) => obj.category);
  const categoryGroups = Object.entries(group).map(([category, values]) => ({
    category,
    values,
  }));

  return categoryGroups;
};

const DataEntryCategorySections = ({
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

  const categories = groupByCategory(entries);

  return (
    <div id="data-entry_category_section">
      {categories.map((category, index) => (
        <Row key={category.category} gutter={[16, 16]} className="data-entry">
          <Col key={index} span={8}>
            <h3 className="data-entry_category-descr-header">
              {t("aboutAttribute", { attribute: category.category })}
            </h3>
            {t("attributeDescription", {
              description: "TBD", // TODO: Remove on description update
            })}
          </Col>
          <Col span={16}>
            <Card type="inner" title={category.category}>
              <div className="data-entry-form_input-grid">
                {category.values.map((item) => (
                  <label
                    key={item.index}
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
                      onChange={(e) => handleChange(e, item.index)}
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
        </Row>
      ))}
    </div>
  );
};

export { DataEntryCategorySections };
