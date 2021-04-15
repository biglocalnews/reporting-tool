import React, { Suspense } from "react";
import { Switch, Route, BrowserRouter, Redirect } from "react-router-dom";
import { Layout } from "antd";
import AppHeader from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";
import { Home } from "./components/Home";
import { DatasetDetails } from "./components/DatasetDetails";
import "./App.css";
import { DataEntry } from "./components/DataEntry";

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
                    exact
                    path="/dataset/:datasetId/details"
                    component={DatasetDetails}
                  />
                  <Route
                    key="add-entry"
                    exact
                    path="/dataset/:datasetId/entry"
                    component={DataEntry}
                  />
                  <Route
                    key="edit-entry"
                    exact
                    path="/dataset/:datasetId/entry/edit/:recordId"
                    component={DataEntry}
                  />
                  <Redirect
                    exact
                    from="/dataset/:datasetId/entry/reload"
                    to="/dataset/:datasetId/entry"
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
