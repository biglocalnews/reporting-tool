import { mockUserLoggedIn, mockUserLogIn } from "../graphql/__mocks__/auth";

it("marks user as admin correctly", async () => {
  const { auth } = mockUserLoggedIn({
    roles: [{ name: "admin", description: "" }],
  });
  await auth.init();
  expect(auth.isAdmin()).toBe(true);
});

it("marks user as non-admin correctly", async () => {
  const { auth } = mockUserLoggedIn({ roles: [] });
  expect(auth.isAdmin()).toBe(false);
  await auth.init();
  expect(auth.isAdmin()).toBe(false);
});

it("logs a user in and out correctly", async () => {
  const user = "tester@notrealemail.info";
  const password = "password";
  const { auth } = mockUserLogIn(user, password);
  await auth.init();

  expect(await auth.login(user, password)).toBeNull();
  expect(auth.isLoggedIn()).toBe(true);
  expect(auth.getFullName()).toEqual("Penelope Pomegranate");

  expect(await auth.logout()).toBeNull();
  expect(auth.isLoggedIn()).toBe(false);
});

it("reports an error if user is not authed", async () => {
  const user = "tester@notrealemail.info";
  const password = "password";
  const { auth } = mockUserLogIn(user, password);
  await auth.init();

  expect(await auth.login("wrong", "password")).toEqual("Unauthorized");
  expect(auth.isLoggedIn()).toBe(false);
  expect(auth.getFullName()).toEqual("");
});
