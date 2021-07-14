import { shallow } from "enzyme";
import App, { ProtectedAppContainer } from "../App";
import { AuthProvider } from "../components/AuthProvider";
import { mockUserLoggedIn } from "../graphql/__mocks__/auth";

describe("App Component", () => {
  test("renders correctly", async () => {
    const { auth } = mockUserLoggedIn();
    await auth.init();

    const tree = shallow(<App />, {
      wrappingComponent: AuthProvider,
      wrappingComponentProps: { auth },
    });

    expect(tree).toBeTruthy();
  });
});

describe("ProtectedAppContainer", () => {
  test("renders correctly", async () => {
    const tree = shallow(
      <ProtectedAppContainer>
        <div />
      </ProtectedAppContainer>
    );
    expect(tree).toBeTruthy();
  });
});
