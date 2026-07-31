import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import FileUpload from "../../components/FileUpload.vue";
import SettingsPanel from "../../components/SettingsPanel.vue";
import TransportControls from "../../components/TransportControls.vue";
import StatisticsPanel from "../../components/StatisticsPanel.vue";
import ExportButton from "../../components/ExportButton.vue";
import ErrorDisplay from "../../components/ErrorDisplay.vue";

describe("FileUpload", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render upload area", () => {
    const wrapper = mount(FileUpload);
    expect(wrapper.text()).toContain("Drop your video here");
  });

  it("should show file picker button", () => {
    const wrapper = mount(FileUpload);
    expect(wrapper.text()).toContain("Select File");
  });
});

describe("SettingsPanel", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render settings panel", () => {
    const wrapper = mount(SettingsPanel);
    expect(wrapper.text()).toContain("Silence Removal Settings");
  });

  it("should show simple mode by default", () => {
    const wrapper = mount(SettingsPanel);
    expect(wrapper.text()).toContain("Advanced");
  });
});

describe("TransportControls", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render transport controls", () => {
    const wrapper = mount(TransportControls);
    expect(wrapper.text()).toContain("Speed:");
  });

  it("should show play button", () => {
    const wrapper = mount(TransportControls);
    expect(wrapper.text()).toContain("▶");
  });
});

describe("StatisticsPanel", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render statistics panel", () => {
    const wrapper = mount(StatisticsPanel);
    expect(wrapper.text()).toContain("Statistics");
  });

  it("should show zero values initially", () => {
    const wrapper = mount(StatisticsPanel);
    expect(wrapper.text()).toContain("0:00");
  });
});

describe("ExportButton", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render export button", () => {
    const wrapper = mount(ExportButton);
    expect(wrapper.text()).toContain("Export Video");
  });

  it("should be disabled when no timeline", () => {
    const wrapper = mount(ExportButton);
    const button = wrapper.find("button");
    expect(button.attributes("disabled")).toBeDefined();
  });
});

describe("ErrorDisplay", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render nothing when no errors", () => {
    const wrapper = mount(ErrorDisplay);
    expect(wrapper.text()).toBe("");
  });
});
