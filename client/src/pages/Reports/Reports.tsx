import { Pie } from "@ant-design/charts";
import { PercentageOutlined, UploadOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Card, Col, DatePicker, Divider, Row, Space, Tabs } from "antd";
import { GetAllTags } from "../../graphql/__generated__/GetAllTags";
import { GET_ALL_TAGS } from "../../graphql/__queries__/GetAllTags.gql";

const { TabPane } = Tabs;

const { Meta } = Card;

const onClick = (): any => {
  console.log("ahh! I've been clicked!");
};

const genderData = [
  {
    type: "Men",
    value: 57,
  },
  {
    type: "Other",
    value: 43,
  },
];

const genderConfig = {
  appendPadding: 10,
  data: genderData,
  angleField: "value",
  colorField: "type",
  radius: 0.8,
  label: {
    type: "outer",
    content: "{name} {percentage}",
  },
  interactions: [{ type: "pie-legend-active" }, { type: "element-active" }],
};

// const raceData = [
//   {
//     type: "BAME",
//     value: 34,
//   },
//   {
//     type: "Other",
//     value: 66,
//   },
// ];

// const raceConfig = {
//   appendPadding: 10,
//   data: raceData,
//   angleField: "value",
//   colorField: "type",
//   radius: 0.8,
//   label: {
//     type: "outer",
//     content: "{name} {percentage}",
//   },
//   interactions: [{ type: "pie-legend-active" }, { type: "element-active" }],
// };

const Overview = () => (
  <>
    <Row
      style={{
        display: "flex",
        justifyContent: "space-around",
        margin: "50px",
      }}
    >
      <Col span={6}>
        <Card
          style={{
            display: "flex",
            justifyContent: "center",
            border: "2px solid rgb(214,214,214)",
            borderRadius: "25px",
          }}
        >
          <div style={{ fontSize: "30px", color: "rgb(48,48,48)" }}>158</div>
          <div style={{ fontSize: "20px", color: "rgb(107,107,107)" }}>
            Teams
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card
          style={{
            display: "flex",
            justifyContent: "center",
            border: "2px solid rgb(214,214,214)",
            borderRadius: "25px",
          }}
        >
          <div style={{ fontSize: "30px", color: "rgb(48,48,48)" }}>543</div>
          <div style={{ fontSize: "20px", color: "rgb(107,107,107)" }}>
            Datasets
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card
          style={{
            display: "flex",
            justifyContent: "center",
            border: "2px solid rgb(214,214,214)",
            borderRadius: "25px",
          }}
        >
          <div style={{ fontSize: "30px", color: "rgb(48,48,48)" }}>4567</div>
          <div style={{ fontSize: "20px", color: "rgb(107,107,107)" }}>
            Tags
          </div>
        </Card>
      </Col>
    </Row>
  </>
);

const Circle = () => {
  return (
    <div style={circleStyle}>
      <PercentageOutlined
        style={{ fontSize: "30px", color: "rgb(231, 82, 93)" }}
      />
    </div>
  );
};
const circleStyle = {
  padding: 10,
  margin: 20,
  display: "inline-block",
  backgroundColor: "rgba(217,233,246, .6)",
  borderRadius: "50%",
  width: 50,
  height: 50,
};

// const stats = getDatasetStatsByCategory(data);

const GenderOverView = () => (
  <Card>
    <Row justify="center" align="top" gutter={16}>
      <Col span={12}>
        <h2>Gender Overview</h2>
        <p>YTD</p>
        <Divider />
        <Card>
          <Pie {...genderConfig} />
        </Card>
      </Col>
      <Col span={12}>
        <Col span={12}>
          <Circle />
          <Space>
            <h1 style={{ fontSize: "45px" }}>10%</h1>
          </Space>
          <p>Datasets did not meet their minimum target</p>
        </Col>
        <Col span={12}>
          <Space>
            <PercentageOutlined />
            <h1>90%</h1>
          </Space>
          <p>Datasets met their minimum target</p>
        </Col>
      </Col>
    </Row>
  </Card>
);

// const RaceOverview = () => (
//   <Card>
//     <Row>
//       <Col span={12}>
//         <h2>Race / Ethnicity</h2>
//         <p>YTD</p>
//         <Divider />
//         <Card>
//           <Pie {...raceConfig} />
//         </Card>
//       </Col>
//       <Col span={12}>col-12</Col>
//     </Row>
//   </Card>
// );

const Cat = () => (
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
);

export const Reports = (): JSX.Element => {
  const tags = useQuery<GetAllTags>(GET_ALL_TAGS);
  const availableTags = tags?.data?.tags || [];

  console.log(availableTags, "checking tags");
  return (
    <>
      <Card
        title="Reporting Dashboard"
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
        <Tabs defaultActiveKey="1" type="card" size={"large"}>
          <TabPane tab="Overview" key="1">
            <h2>Reporting Insights: Overview</h2>
            <Overview />
            <GenderOverView />
            {/* <RaceOverview /> */}
          </TabPane>
          <TabPane tab="Comparison" key="2">
            <h2>Reporting Insights: Comparison</h2>
            <Cat />
          </TabPane>
          <TabPane tab="Historical" key="3">
            <h2>Reporting Insights: Historical</h2>
          </TabPane>
        </Tabs>
      </Card>
    </>
  );
};
