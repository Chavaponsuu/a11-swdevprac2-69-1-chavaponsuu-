import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import dayjs from "dayjs";
import BookingPage from "@/app/booking/page";
import BookingList from "@/components/BookingList";
import { addBooking, removeBooking } from "@/redux/features/bookSlice";
import { makeStore } from "@/redux/store";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => mockPush.mockClear());

it("books as a visitor and displays the submitted details from Redux", async () => {
  const store = makeStore();
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <BookingPage />
      <BookingList />
    </Provider>,
  );

  expect(screen.getByText("No Venue Booking")).toBeInTheDocument();
  await user.type(screen.getByRole("textbox", { name: /Name-Lastname/ }), " James Weston ");
  await user.type(screen.getByRole("textbox", { name: /Contact-Number/ }), "0827789544");
  await user.click(screen.getByRole("combobox", { name: /Venue/ }));
  await user.click(screen.getByRole("option", { name: "The Bloom Pavilion" }));
  await user.click(screen.getByRole("button", { name: "Book Venue" }));

  expect(store.getState().bookSlice.bookItems).toEqual([{
    nameLastname: "James Weston",
    tel: "0827789544",
    venue: "Bloom",
    bookDate: dayjs().format("YYYY/MM/DD"),
  }]);
  expect(mockPush).toHaveBeenCalledWith("/mybooking");
  expect(screen.getByText("James Weston")).toBeInTheDocument();
  expect(screen.getByText("0827789544")).toBeInTheDocument();
  expect(screen.queryByText("No Venue Booking")).not.toBeInTheDocument();
});

it("cancels only the selected booking and shows the empty state after the last cancellation", async () => {
  const store = makeStore();
  const user = userEvent.setup();
  store.dispatch(addBooking({ nameLastname: "James Weston", tel: "0827789544", venue: "Bloom", bookDate: "2026/11/21" }));
  store.dispatch(addBooking({ nameLastname: "Jane Adison", tel: "0925447885", venue: "GrandTable", bookDate: "2026/12/18" }));
  render(<Provider store={store}><BookingList /></Provider>);

  await user.click(screen.getByRole("button", { name: "Cancel booking for Bloom on 2026/11/21" }));
  expect(screen.queryByText("James Weston")).not.toBeInTheDocument();
  expect(screen.getByText("Jane Adison")).toBeInTheDocument();
  expect(store.getState().bookSlice.bookItems).toHaveLength(1);

  await user.click(screen.getByRole("button", { name: /Cancel booking/ }));
  expect(screen.getByText("No Venue Booking")).toBeInTheDocument();
  expect(store.getState().bookSlice.bookItems).toEqual([]);
});

it("preserves other dates and venues and ignores cancellation using replaced contact details", () => {
  const store = makeStore();
  const original = { nameLastname: "David Smith", tel: "0845526325", venue: "Bloom", bookDate: "2026/11/21" };
  const replacement = { ...original, nameLastname: "James Weston", tel: "0827789544" };
  const anotherDate = { ...original, bookDate: "2026/11/22" };
  const anotherVenue = { ...original, venue: "Spark" };
  [original, anotherDate, anotherVenue, replacement].forEach((booking) => store.dispatch(addBooking(booking)));

  expect(store.getState().bookSlice.bookItems).toEqual([replacement, anotherDate, anotherVenue]);
  store.dispatch(removeBooking({ ...replacement, nameLastname: original.nameLastname }));
  store.dispatch(removeBooking({ ...replacement, tel: original.tel }));
  expect(store.getState().bookSlice.bookItems).toHaveLength(3);
  store.dispatch(removeBooking(replacement));
  expect(store.getState().bookSlice.bookItems).toEqual([anotherDate, anotherVenue]);
});

it("does not store incomplete bookings", () => {
  const store = makeStore();
  const { container } = render(<Provider store={store}><BookingPage /></Provider>);
  fireEvent.submit(container.querySelector("form")!);

  expect(screen.getByRole("alert")).toHaveTextContent("Please enter your name");
  expect(store.getState().bookSlice.bookItems).toEqual([]);
  expect(mockPush).not.toHaveBeenCalled();
});
