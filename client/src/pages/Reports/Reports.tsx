import { UploadOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Card, DatePicker, Space } from "antd";
import { GetAllTags } from "../../graphql/__generated__/GetAllTags";
import { GET_ALL_TAGS } from "../../graphql/__queries__/GetAllTags.gql";

const { Meta } = Card;

const onClick = (): any => {
  console.log("ahh! I've been clicked!");
};

export const Reports = (): JSX.Element => {
  const tags = useQuery<GetAllTags>(GET_ALL_TAGS);
  const availableTags = tags?.data?.tags || [];

  console.log(availableTags, "checking tags");
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
      ></Card>
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
