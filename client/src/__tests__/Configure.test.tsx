import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Suspense } from "react";
import { Router } from "react-router-dom";
import { AuthProvider } from "../components/AuthProvider";
import { mockBlankSlate } from "../graphql/__mocks__/auth";
import { FIRST_TIME_CONFIGURE } from "../graphql/__mutations__/FirstTimeConfigure.gql";
import { Configure } from "../pages/Configure";
import { tick } from "./utils";

it("allows user to configure app on the first time", async () => {
  const { auth } = mockBlankSlate();
  await auth.init();
  let navigate = createMemoryHistory();
  history.replace("/anywhere/but/home");

  await tick();

  const configure = {
    request: {
      query: FIRST_TIME_CONFIGURE,
      variables: {
        input: {
          organization: "my org",
          firstName: "tina",
          lastName: "turner",
          email: "tina@turner.org",
        },
      },
    },
    result: {
      data: {
        configureApp: "00000004-b910-4f6e-8f3c-8201c1111111",
      },
    },
  };

  render(
    <Suspense fallback={<div />}>
      <MockedProvider mocks={[configure]}>
        <Router history={history}>
          <AuthProvider auth={auth}>
            <Configure />
          </AuthProvider>
        </Router>
      </MockedProvider>
    </Suspense>
  );

  await tick();

  fireEvent.change(screen.getByRole("textbox", { name: /organization/ }), {
    target: { value: "my org" },
  });

  fireEvent.change(screen.getByRole("textbox", { name: /firstName/ }), {
    target: { value: "tina" },
  });

  fireEvent.change(screen.getByRole("textbox", { name: /lastName/ }), {
    target: { value: "turner" },
  });

  fireEvent.change(screen.getByRole("textbox", { name: /email/ }), {
    target: { value: "tina@turner.org" },
  });

  await tick();

  fireEvent.click(screen.getByRole("button"));

  // field validation
  await tick();

  // network request
  await tick();

  // check for no errors (either from validation or query)
  expect(document.querySelector('[role="alert"]')).toBeNull();
  // check that redirect worked
  expect(history.location.pathname).toEqual(
    "/admin/users/00000004-b910-4f6e-8f3c-8201c1111111"
  );
});
