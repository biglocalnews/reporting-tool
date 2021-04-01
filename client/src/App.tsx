import React, { Suspense } from "react";
import { Switch, Route, BrowserRouter } from "react-router-dom";
import { Layout } from "antd";
import AppHeader from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";
import { Home } from "./components/Home";
import { ViewDatasetDetails } from "./components/ViewDatasetDetails";

const { Footer, Content } = Layout;

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<h1>Loading...</h1>}>
        <Layout style={{ height: "100vh" }}>
          <AppHeader />
          <Layout>
            <AppSidebar />
            <Layout style={{ padding: "0 24px 24px" }}>
              <Content
                className="site-layout-background"
                style={{
                  padding: 24,
                  marginTop: 24,
                  minHeight: 280,
                }}
              >
                <Switch>
                  <Route exact path="/" component={Home} />
                  <Route
                    path="/dataset-details/:datasetId"
                    component={ViewDatasetDetails}
                  />
                </Switch>
              </Content>
              <Footer style={{ textAlign: "center" }}>Footer content</Footer>
            </Layout>
          </Layout>
        </Layout>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
