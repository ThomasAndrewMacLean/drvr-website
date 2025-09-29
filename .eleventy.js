const { DateTime } = require("luxon");
const fs = require("fs");
const yaml = require("js-yaml");

module.exports = function (eleventyConfig) {
  // Passthrough copy for CMS
  //   eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Date filter for templates
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy") => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
  });

  // Add findIndex filter for finding array index
  eleventyConfig.addFilter("findIndex", (array, property, value) => {
    return array.findIndex((item) => item[property] == value);
  });

  // Add "now" global variable (the build time)
  eleventyConfig.addGlobalData("now", new Date());

  return {
    dir: {
      input: "src",
      output: "docs",
    },
  };
};
