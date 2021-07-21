import { MockedProvider } from "@apollo/client/testing";
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../components/AuthProvider";
import { mockBlankSlate } from "../graphql/__mocks__/auth";
import { Login } from "../pages/Login/Login";
import { RenderRoutes } from "../router/Router";
import { tick } from "./utils";

it("renders the first-time configuration page when app is in blank slate", async () => {
  const { auth } = mockBlankSlate();
  await auth.init();

  render(
    <Suspense fallback={<div />}>
      <MockedProvider mocks={[]}>
        <MemoryRouter initialEntries={["/anywhere"]}>
          <AuthProvider auth={auth}>
            <RenderRoutes
              loginComponent={Login}
              adminRoutes={[]}
              protectedRoutes={[]}
              protectedContainer={() => <div />}
            />
          </AuthProvider>
        </MemoryRouter>
      </MockedProvider>
    </Suspense>
  );

  await tick();

  expect(
    screen.getByRole("textbox", { name: /organization/ })
  ).toBeInTheDocument();
});
