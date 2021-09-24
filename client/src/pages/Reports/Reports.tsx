import { UploadOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Select, Space } from "antd";
const { Meta } = Card;
const { Option } = Select;

function onChange(value: any) {
  console.log(`i've selected ${value}`);
}

function onBlur() {
  console.log("blurrrrring everything");
}

function onFocus() {
  console.log("focused on the goal");
}

function onSearch(value: any) {
  console.log("i am looking for:", value);
}

const onClick = (): any => {
  console.log("ahh! I have to export!");
};

export const Reports = () => {
  return (
    <>
      <Card
        title="Reporting Insights"
        extra={
          <Space>
            <Button onClick={onClick} ghost type="primary" size={"large"}>
              <UploadOutlined /> Export
            </Button>
            <DatePicker size={"large"} picker="month" />
          </Space>
        }
        style={{ width: "100%" }}
      >
        <Space>
          <Select
            showSearch
            size="large"
            style={{ width: 200 }}
            placeholder="Select Category"
            optionFilterProp="children"
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onSearch={onSearch}
            // filterOption={(input, option) =>
            //   option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            // }
          >
            <Option value="race">Race</Option>
            <Option value="gender">Gender</Option>
            <Option value="ethnicity">Ethnicity</Option>
          </Select>
          <Select
            showSearch
            size="large"
            style={{ width: 200 }}
            placeholder="Select Team"
            optionFilterProp="children"
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onSearch={onSearch}
            // filterOption={(input, option) =>
            //   option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            // }
          >
            <Option value="newsTeam">News Team</Option>
          </Select>
          <Select
            showSearch
            size="large"
            style={{ width: 200 }}
            placeholder="Select Dataset"
            optionFilterProp="children"
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onSearch={onSearch}
            // filterOption={(input, option) =>
            //   option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            // }
          >
            <Option value="12pm-4pm">12PM - 4PM</Option>
            <Option value="breakfastHour">Breakfast Hour</Option>
          </Select>
          <Select
            showSearch
            size="large"
            style={{ width: 200 }}
            placeholder="Select Tag"
            optionFilterProp="children"
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onSearch={onSearch}
            // filterOption={(input, option) =>
            //   option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            // }
          >
            <Option value="news">News</Option>
          </Select>
          <Button onClick={onClick} type="primary" size={"large"}>
            Apply Filter
          </Button>
        </Space>
      </Card>
      <Space>
        <Card>
          <h3>158</h3>
          <p>Teams</p>
        </Card>
        <Card>
          <h3>543</h3>
          <p>Datasets</p>
        </Card>
        <Card>
          <h3>4567</h3>
          <p>Tags</p>
        </Card>
      </Space>
      <Card
        hoverable
        style={{ width: "100%" }}
        cover={
          <img
            alt="Reporting Cat"
            src="https://media2.giphy.com/media/UslGBU1GPKc0g/giphy.gif"
          />
        }
      >
        <Meta title="Reporting Cat" description="a work in progress" />
      </Card>
    </>
  );
};
