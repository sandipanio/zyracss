/**
 * Spacing utility mappings for ZyraCSS
 * Covers padding, margin, and gap properties
 * Format: [prefix, css-property]
 */
export const SPACING_MAP = new Map([
  /******************************************************************/
  /* Padding */
  /******************************************************************/

  // Padding - Full names
  ["padding", "padding"],
  ["padding-top", "padding-top"],
  ["padding-right", "padding-right"],
  ["padding-bottom", "padding-bottom"],
  ["padding-left", "padding-left"],

  // Padding - Short prefixes
  ["p", "padding"],
  ["pt", "padding-top"],
  ["pr", "padding-right"],
  ["pb", "padding-bottom"],
  ["pl", "padding-left"],

  // Padding Block and Inline
  ["padding-block", "padding-block"],
  ["padding-block-start", "padding-block-start"],
  ["padding-block-end", "padding-block-end"],
  ["padding-inline", "padding-inline"],
  ["padding-inline-start", "padding-inline-start"],
  ["padding-inline-end", "padding-inline-end"],

  // Padding Block and Inline - Short prefixes
  ["py", "padding-block"],
  ["py-start", "padding-block-start"],
  ["py-end", "padding-block-end"],
  ["px", "padding-inline"],
  ["px-start", "padding-inline-start"],
  ["px-end", "padding-inline-end"],

  /******************************************************************/
  /* Margin */
  /******************************************************************/

  // Margin - Full names
  ["margin", "margin"],
  ["margin-top", "margin-top"],
  ["margin-right", "margin-right"],
  ["margin-bottom", "margin-bottom"],
  ["margin-left", "margin-left"],

  // Margin - Short prefixes
  ["m", "margin"],
  ["mt", "margin-top"],
  ["mr", "margin-right"],
  ["mb", "margin-bottom"],
  ["ml", "margin-left"],

  // Margin Block and Inline
  ["margin-block", "margin-block"],
  ["margin-block-start", "margin-block-start"],
  ["margin-block-end", "margin-block-end"],
  ["margin-inline", "margin-inline"],
  ["margin-inline-start", "margin-inline-start"],
  ["margin-inline-end", "margin-inline-end"],

  // Margin Block and Inline - Short prefixes
  ["my", "margin-block"],
  ["my-start", "margin-block-start"],
  ["my-end", "margin-block-end"],
  ["mx", "margin-inline"],
  ["mx-start", "margin-inline-start"],
  ["mx-end", "margin-inline-end"],

  /******************************************************************/
  /* Gap */
  /******************************************************************/

  // Gap (for flexbox/grid)
  ["gap", "gap"],
  ["column-gap", "column-gap"],
  ["row-gap", "row-gap"],

  // Gap (for flexbox/grid) - Short prefixes
  ["g", "gap"],
  ["col-gap", "column-gap"],
  ["row-gap", "row-gap"],
]);
