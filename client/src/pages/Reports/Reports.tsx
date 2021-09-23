import { Card } from "antd";
const { Meta } = Card;

export const Reports = () => {
  return (
    <Card
      hoverable
      style={{ width: 240 }}
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
};
