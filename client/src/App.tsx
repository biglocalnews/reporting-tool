import React, { Suspense } from "react";
import { Switch, Route, BrowserRouter } from "react-router-dom";
import { Layout } from "antd";
import AppHeader from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";
import { Home } from "./components/Home";
import { DatasetDetails } from "./components/DatasetDetails";
import { DataEntry } from "./components/DataEntry";
import "./App.css";

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
              <Content className="site-layout-background">
                <Switch>
                  <Route exact path="/" component={Home} />
                  <Route
                    path="/dataset/:datasetId/details"
                    component={DatasetDetails}
                  />
                  <Route
                    path="/dataset/:datasetId/entry"
                    component={DataEntry}
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
