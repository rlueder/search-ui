import React from "react";
import { act } from "react-dom/test-utils";
import SearchBoxContainer from "../SearchBox";
import { shallow, mount } from "enzyme";
import { SearchBoxViewProps } from "@elastic/react-search-ui-views";
import { useSearch } from "../../hooks";

jest.mock("../../hooks", () => ({
  useSearch: jest.fn()
}));

const params = {
  autocompletedResults: [],
  autocompletedSuggestions: {},
  searchTerm: "test",
  setSearchTerm: jest.fn(),
  trackAutocompleteClickThrough: jest.fn(),
  trackAutocompleteSuggestionClickThrough: jest.fn()
};

beforeEach(() => {
  jest.clearAllMocks();

  (useSearch as jest.Mock).mockReturnValue(params);
});

it("supports a render prop", () => {
  const render = ({ value }: SearchBoxViewProps) => {
    return <div>{value}</div>;
  };
  const wrapper = shallow(<SearchBoxContainer view={render} />).dive();
  expect(wrapper).toMatchSnapshot();
});

it("will keep focus prop in sync with view component", async () => {
  let viewProps;
  const View = (props) => {
    viewProps = props;
    return <div />;
  };

  const wrapper = mount(<SearchBoxContainer view={View} />);

  expect(viewProps.isFocused).toBe(false);
  expect(wrapper.find(View).props().isFocused).toBe(false);
  await act(() => {
    viewProps.inputProps.onFocus();
  });
  wrapper.update();
  expect(wrapper.find(View).props().isFocused).toBe(true);

  await act(() => {
    viewProps.inputProps.onBlur();
  });

  wrapper.update();
  expect(wrapper.find(View).props().isFocused).toBe(false);
});

it("will pass autocompleteView prop through to the view", () => {
  let viewProps;
  const customAutocompleteView = () => <div />;

  shallow(
    <SearchBoxContainer
      autocompleteView={customAutocompleteView}
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();

  const { autocompleteView } = viewProps;
  expect(autocompleteView).toEqual(customAutocompleteView);
});

describe("autocompletedSuggestionsCount", () => {
  it("will calculate the total count of all suggestions", () => {
    let viewProps;
    (useSearch as jest.Mock).mockReturnValue({
      ...params,
      autocompletedSuggestions: {
        documents: [
          { suggestion: "carlsbad" },
          { suggestion: "carlsbad caverns" },
          { suggestion: "carolina" }
        ],
        other: [],
        another: [{ suggestion: "carlsbad" }]
      }
    });

    shallow(
      <SearchBoxContainer
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    viewProps.onChange("new term");
    expect(viewProps.autocompletedSuggestionsCount).toBe(4);
  });

  it("will calculate the total count of all suggestions when there are none", () => {
    let viewProps;
    (useSearch as jest.Mock).mockReturnValue({
      ...params,
      autocompletedSuggestions: {}
    });

    shallow(
      <SearchBoxContainer
        autocompleteSuggestions={false}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    viewProps.onChange("new term");
    expect(viewProps.autocompletedSuggestionsCount).toBe(0);
  });
});

describe("allAutocompletedItemsCount", () => {
  it("will calculate the total count of all autocomplete items", () => {
    (useSearch as jest.Mock).mockReturnValue({
      ...params,
      autocompletedResults: [{ id: { raw: 1 } }, { id: { raw: 2 } }],
      autocompletedSuggestions: {
        documents: [
          { suggestion: "carlsbad" },
          { suggestion: "carlsbad caverns" },
          { suggestion: "carolina" }
        ],
        other: [],
        another: [{ suggestion: "carlsbad" }]
      }
    });
    let viewProps;

    shallow(
      <SearchBoxContainer
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    viewProps.onChange("new term");
    expect(viewProps.allAutocompletedItemsCount).toBe(6);
  });

  it("will calculate the total count of all autocomplete items when there are none", () => {
    (useSearch as jest.Mock).mockReturnValue({
      ...params,
      autocompletedResults: [],
      autocompletedSuggestions: {}
    });
    let viewProps;

    shallow(
      <SearchBoxContainer
        autocompleteResults={false}
        autocompleteSuggestions={false}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    viewProps.onChange("new term");
    expect(viewProps.allAutocompletedItemsCount).toBe(0);
  });
});

describe("useAutocomplete", () => {
  it("will be true if autocompleteResults configuration has been provided", () => {
    let viewProps;

    shallow(
      <SearchBoxContainer
        autocompleteResults={{
          titleField: "title",
          urlField: "nps_link"
        }}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    viewProps.onChange("new term");
    expect(viewProps.useAutocomplete).toBe(true);
  });

  it("will be false if no autocomplete config has been provided", () => {
    let viewProps;
    shallow(
      <SearchBoxContainer
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    viewProps.onChange("new term");
    expect(viewProps.useAutocomplete).toBe(false);
  });

  it("will be true if autocompleteSuggestions configuration has been provided", () => {
    let viewProps;

    shallow(
      <SearchBoxContainer
        autocompleteSuggestions={{
          documents: {
            sectionTitle: "Suggested Queries"
          }
        }}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    viewProps.onChange("new term");
    expect(viewProps.useAutocomplete).toBe(true);
  });

  it("will be false if autocompleteMinimumCharacters is below threshold", () => {
    let viewProps;

    shallow(
      <SearchBoxContainer
        autocompleteMinimumCharacters={4}
        autocompleteSuggestions={{
          documents: {
            sectionTitle: "Suggested Queries"
          }
        }}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    viewProps.onChange("new");
    expect(viewProps.useAutocomplete).toBe(true);
  });
});

describe("shouldClearFilters prop", () => {
  it("will be passed through to setSearchTerm on submit", () => {
    let viewProps;

    shallow(
      <SearchBoxContainer
        shouldClearFilters={false}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();

    const { onSubmit } = viewProps;
    onSubmit({
      preventDefault: () => ({})
    });
    const call = params.setSearchTerm.mock.calls[0];
    expect(call[1].shouldClearFilters).toEqual(false);
  });

  it("will be passed through to setSearchTerm on change", () => {
    let viewProps;

    shallow(
      <SearchBoxContainer
        shouldClearFilters={false}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();

    const { onChange } = viewProps;
    onChange("new term");
    const call = params.setSearchTerm.mock.calls[0];
    expect(call[1].shouldClearFilters).toEqual(false);
  });

  it("will call setSearchTerm if no onSelectAutocomplete is specified and a suggestion is selected", () => {
    let viewProps;

    shallow(
      <SearchBoxContainer
        autocompleteResults={true}
        shouldClearFilters={false}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();

    const { onSelectAutocomplete } = viewProps;
    onSelectAutocomplete({
      suggestion: "bird"
    });

    const call = params.setSearchTerm.mock.calls[0];
    expect(call[1].shouldClearFilters).toEqual(false);
  });
});

it("will call back to setSearchTerm with refresh: false when input is changed", () => {
  let viewProps;
  shallow(
    <SearchBoxContainer
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();

  expect(viewProps.value).toBe("test");

  viewProps.onChange("new term");

  const call = params.setSearchTerm.mock.calls[0];
  expect(call).toEqual([
    "new term",
    {
      refresh: false,
      autocompleteResults: false,
      autocompleteSuggestions: false,
      shouldClearFilters: true,
      autocompleteMinimumCharacters: 0
    }
  ]);
});

it("will call back to setSearchTerm with autocompleteMinimumCharacters setting", () => {
  let viewProps;
  shallow(
    <SearchBoxContainer
      autocompleteMinimumCharacters={3}
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();
  viewProps.onChange("new term");

  const call = params.setSearchTerm.mock.calls[0];
  expect(call).toEqual([
    "new term",
    {
      refresh: false,
      autocompleteResults: false,
      autocompleteSuggestions: false,
      shouldClearFilters: true,
      autocompleteMinimumCharacters: 3
    }
  ]);
});

it("will call back to setSearchTerm with refresh: true when input is changed and searchAsYouType is true", () => {
  let viewProps;
  shallow(
    <SearchBoxContainer
      searchAsYouType={true}
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();

  expect(viewProps.value).toBe("test");

  viewProps.onChange("new term");

  const call = params.setSearchTerm.mock.calls[0];
  expect(call).toEqual([
    "new term",
    {
      refresh: true,
      debounce: 200,
      autocompleteResults: false,
      autocompleteMinimumCharacters: 0,
      shouldClearFilters: true,
      autocompleteSuggestions: false
    }
  ]);
});

it("will call back to setSearchTerm with a specific debounce when input is changed and searchAsYouType is true and a debounce is provided", () => {
  let viewProps;
  shallow(
    <SearchBoxContainer
      searchAsYouType={true}
      debounceLength={500}
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();

  expect(viewProps.value).toBe("test");

  viewProps.onChange("new term");

  const call = params.setSearchTerm.mock.calls[0];
  expect(call).toEqual([
    "new term",
    {
      refresh: true,
      debounce: 500,
      autocompleteResults: false,
      autocompleteMinimumCharacters: 0,
      shouldClearFilters: true,
      autocompleteSuggestions: false
    }
  ]);
});

it("will call back to setSearchTerm with a specific debounce when input is changed and autocompleteResults is true and a debounce is provided", () => {
  let viewProps;
  shallow(
    <SearchBoxContainer
      autocompleteResults={{
        titleField: "title",
        urlField: "nps_link"
      }}
      debounceLength={500}
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();

  expect(viewProps.value).toBe("test");

  viewProps.onChange("new term");

  const call = params.setSearchTerm.mock.calls[0];
  expect(call).toEqual([
    "new term",
    {
      refresh: false,
      debounce: 500,
      autocompleteResults: true,
      autocompleteMinimumCharacters: 0,
      shouldClearFilters: true,
      autocompleteSuggestions: false
    }
  ]);
});

it("will call back to setSearchTerm with a specific debounce when input is changed and autocompleteSuggestions is true and a debounce is provided", () => {
  let viewProps;
  shallow(
    <SearchBoxContainer
      autocompleteSuggestions={true}
      debounceLength={500}
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();

  expect(viewProps.value).toBe("test");

  viewProps.onChange("new term");

  const call = params.setSearchTerm.mock.calls[0];
  expect(call).toEqual([
    "new term",
    {
      refresh: false,
      debounce: 500,
      autocompleteSuggestions: true,
      autocompleteMinimumCharacters: 0,
      shouldClearFilters: true,
      autocompleteResults: false
    }
  ]);
});

it("will call back setSearchTerm with refresh: true when form is submitted", () => {
  (useSearch as jest.Mock).mockReturnValue({
    ...params,
    searchTerm: "a term"
  });
  let viewProps;

  shallow(
    <SearchBoxContainer
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();

  viewProps.onSubmit({
    preventDefault: jest.fn()
  });

  const call = params.setSearchTerm.mock.calls[0];
  expect(call).toEqual(["a term", { shouldClearFilters: true }]);
});

describe("onSelectAutocomplete", () => {
  it("will pass selection, option, default onSelectAutocomplete function to handler if provided", () => {
    let viewProps;

    let passedSelection;
    let passedNotifyAutocompleteSelected;
    let passedCompleteSuggestion;
    let passedAutocompleteResults;
    let passedDefaultOnSelectAutocomplete;

    const customOnSelectAutocomplete = (
      selection,
      { notifyAutocompleteSelected, completeSuggestion, autocompleteResults },
      defaultOnSelectAutocomplete
    ) => {
      passedSelection = selection;
      passedNotifyAutocompleteSelected = notifyAutocompleteSelected;
      passedCompleteSuggestion = completeSuggestion;
      passedAutocompleteResults = autocompleteResults;
      passedDefaultOnSelectAutocomplete = defaultOnSelectAutocomplete;
    };

    shallow(
      <SearchBoxContainer
        autocompleteResults={true}
        onSelectAutocomplete={customOnSelectAutocomplete}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    const { onSelectAutocomplete } = viewProps;
    onSelectAutocomplete("bird");

    expect(passedSelection).toBe("bird");
    expect(passedNotifyAutocompleteSelected).toBeDefined();
    expect(passedCompleteSuggestion).toBeDefined();
    expect(passedAutocompleteResults).toBeDefined();
    expect(passedDefaultOnSelectAutocomplete).toBeDefined();
  });

  it("will call setSearchTerm if the default onSelectAutomplete is triggered with a suggestion", () => {
    let viewProps;

    shallow(
      <SearchBoxContainer
        autocompleteResults={true}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    const { onSelectAutocomplete } = viewProps;
    onSelectAutocomplete({
      suggestion: "bird"
    });

    const call = params.setSearchTerm.mock.calls[0];
    expect(call[0]).toEqual("bird");
  });

  it("will do nothing if the default onSelectAutocomplete is triggered without a selection", () => {
    let viewProps;

    shallow(
      <SearchBoxContainer
        autocompleteResults={true}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    const { onSelectAutocomplete } = viewProps;
    onSelectAutocomplete();

    expect(params.setSearchTerm).not.toHaveBeenCalled();
  });
});

describe("autocomplete clickthroughs", () => {
  it("will call back to trackAutocompleteClickThrough when an autocomplete item is selected in the view", () => {
    let viewProps;
    shallow(
      <SearchBoxContainer
        autocompleteResults={true}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    const { notifyAutocompleteSelected } = viewProps;
    notifyAutocompleteSelected({
      id: { raw: "123" }
    });
    expect(params.trackAutocompleteClickThrough.mock.calls.length).toBe(1);
  });

  it("will not call back when shouldTrackClickThrough is false", () => {
    let viewProps;
    shallow(
      <SearchBoxContainer
        autocompleteResults={{
          shouldTrackClickThrough: false,
          titleField: "title",
          urlField: "nps_link"
        }}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    const { notifyAutocompleteSelected } = viewProps;
    notifyAutocompleteSelected({
      id: { raw: "123" }
    });
    expect(params.trackAutocompleteClickThrough.mock.calls.length).toBe(0);
  });

  it("will not call back when the selected item is a suggestion", () => {
    let viewProps;
    shallow(
      <SearchBoxContainer
        autocompleteResults={true}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    const { notifyAutocompleteSelected } = viewProps;
    notifyAutocompleteSelected({
      suggestion: "bike"
    });
    expect(params.trackAutocompleteClickThrough.mock.calls.length).toBe(0);
  });

  it("will pass through tags", () => {
    let viewProps;
    shallow(
      <SearchBoxContainer
        autocompleteResults={{
          clickThroughTags: ["whatever"],
          titleField: "title",
          urlField: "nps_link"
        }}
        view={(props) => {
          viewProps = props;
          return <div />;
        }}
      />
    ).dive();
    const { notifyAutocompleteSelected } = viewProps;
    notifyAutocompleteSelected({
      id: { raw: "123" }
    });
    const [documentId, tags] =
      params.trackAutocompleteClickThrough.mock.calls[0];
    expect(documentId).toEqual("123");
    expect(tags).toEqual(["whatever"]);
  });
});

it("passes className through to the view", () => {
  let viewProps;
  const className = "test-class";
  shallow(
    <SearchBoxContainer
      className={className}
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();
  expect(viewProps.className).toEqual(className);
});

it("passes data-foo through to the view", () => {
  let viewProps;
  const data = "bar";
  shallow(
    <SearchBoxContainer
      data-foo={data}
      view={(props) => {
        viewProps = props;
        return <div />;
      }}
    />
  ).dive();
  expect(viewProps["data-foo"]).toEqual(data);
});
