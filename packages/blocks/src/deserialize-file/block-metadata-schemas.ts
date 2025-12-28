import { z } from 'zod'

// Common execution metadata shared by executable blocks
export const executableBlockMetadataSchema = z.object({
  execution_context_id: z.string().optional(),
  execution_millis: z.number().optional(),
  execution_start: z.number().optional(),
  is_code_hidden: z.boolean().optional(),
  is_output_hidden: z.boolean().optional(),
  last_executed_function_notebook_id: z.string().optional(),
  last_function_run_started_at: z.number().optional(),
  source_hash: z.string().optional(),
})

// Table state schema for code/sql blocks
export const tableStateSchema = z.object({
  cellFormattingRules: z.array(z.object({ column: z.string(), rule: z.string() })).optional(),
  columnDisplayNames: z.array(z.object({ columnName: z.string(), displayName: z.string() })).optional(),
  columnOrder: z.array(z.string()).optional(),
  conditionalFilters: z.array(z.unknown()).optional(),
  filters: z.array(z.object({ id: z.string(), value: z.string() })).optional(),
  hiddenColumnIds: z.array(z.string()).optional(),
  pageIndex: z.number().optional(),
  pageSize: z.number().optional(),
  sortBy: z.array(z.object({ id: z.string(), desc: z.boolean() })).optional(),
  wrappedTextColumnIds: z.array(z.string()).optional(),
})

// Code block metadata
export const codeBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_table_state: tableStateSchema.optional(),
})

// SQL block metadata
export const sqlBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_return_variable_type: z.enum(['dataframe', 'query_preview']).optional(),
  deepnote_table_state: tableStateSchema.optional(),
  deepnote_variable_name: z.string().optional(),
  function_export_name: z.string().optional(),
  is_compiled_sql_query_visible: z.boolean().optional(),
  sql_integration_id: z.string().optional(),
})

// Input block metadata schemas
export const inputTextBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string(),
  deepnote_variable_value: z.string(),
})

export const inputTextareaBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string(),
  deepnote_variable_value: z.string(),
})

export const inputCheckboxBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string(),
  deepnote_variable_value: z.boolean(),
})

export const inputSelectBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string(),
  deepnote_variable_value: z.union([z.string(), z.array(z.string())]),
  deepnote_variable_options: z.array(z.string()).optional(),
  deepnote_variable_custom_options: z.array(z.string()).optional(),
  deepnote_variable_selected_variable: z.string().optional(),
  deepnote_variable_select_type: z.enum(['from_options', 'from_variable']).optional(),
  deepnote_allow_multiple_values: z.boolean().optional(),
})

export const inputSliderBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string(),
  deepnote_variable_value: z.string(),
  deepnote_slider_min_value: z.number().optional(),
  deepnote_slider_max_value: z.number().optional(),
  deepnote_slider_step: z.number().optional(),
})

export const inputFileBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string(),
  deepnote_variable_value: z.string(),
})

export const inputDateBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string(),
  deepnote_variable_value: z.string(),
  deepnote_input_date_version: z.number().optional(),
})

// Date range value can be a string, array of 2 strings, or interval string
export const dateRangeValueSchema = z.union([z.string(), z.tuple([z.string(), z.string()])])

export const inputDateRangeBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string(),
  deepnote_variable_value: dateRangeValueSchema,
})

// Button block metadata
export const buttonBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_button_title: z.string().optional(),
  deepnote_button_color_scheme: z.string().optional(),
  deepnote_button_behavior: z.enum(['run', 'set_variable']).optional(),
  deepnote_variable_name: z.string().optional(),
})

// Visualization block metadata
export const visualizationBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_variable_name: z.string().optional(),
  deepnote_visualization_spec: z.unknown().optional(),
  deepnote_chart_filter: z
    .object({
      advancedFilters: z.array(z.unknown()).optional(),
    })
    .optional(),
})

// Big number block metadata
export const bigNumberBlockMetadataSchema = executableBlockMetadataSchema.extend({
  deepnote_big_number_title: z.string().optional(),
  deepnote_big_number_value: z.string().optional(),
  deepnote_big_number_format: z.string().optional(),
  deepnote_big_number_comparison_enabled: z.boolean().optional(),
  deepnote_big_number_comparison_title: z.string().optional(),
  deepnote_big_number_comparison_value: z.string().optional(),
  deepnote_big_number_comparison_type: z.string().optional(),
  deepnote_big_number_comparison_format: z.string().optional(),
})

// Text block metadata schemas
export const formattedRangeMarksSchema = z.object({
  bold: z.boolean().optional(),
  code: z.boolean().optional(),
  color: z.string().optional(),
  italic: z.boolean().optional(),
  strike: z.boolean().optional(),
  underline: z.boolean().optional(),
})

export const formattedRangeTextSchema = z.object({
  fromCodePoint: z.number(),
  marks: formattedRangeMarksSchema,
  toCodePoint: z.number(),
  type: z.literal('marks').optional(),
})

export const formattedRangeLinkSchema = z.object({
  fromCodePoint: z.number(),
  ranges: z.array(formattedRangeTextSchema),
  toCodePoint: z.number(),
  type: z.literal('link'),
  url: z.string(),
})

export const formattedRangeSchema = z.union([formattedRangeTextSchema, formattedRangeLinkSchema])

export const textBlockMetadataSchema = z.object({
  formattedRanges: z.array(formattedRangeSchema).optional(),
  is_collapsed: z.boolean().optional(),
})

export const todoTextBlockMetadataSchema = textBlockMetadataSchema.extend({
  checked: z.boolean().optional(),
})

export const calloutTextBlockMetadataSchema = textBlockMetadataSchema.extend({
  color: z.enum(['blue', 'green', 'yellow', 'red', 'purple']).optional(),
})

// Image block metadata
export const imageBlockMetadataSchema = z.object({
  deepnote_img_src: z.string().optional(),
  deepnote_img_width: z.string().optional(),
  deepnote_img_alignment: z.string().optional(),
})

// Markdown cell metadata (for converted Jupyter cells)
export const markdownCellMetadataSchema = z.object({
  deepnote_cell_height: z.number().optional(),
})

// Separator block metadata (empty)
export const separatorBlockMetadataSchema = z.object({})

// Union of all known metadata types with passthrough for unknown fields
// This maintains backward compatibility while providing validation for known fields
export const blockMetadataSchema = z
  .union([
    codeBlockMetadataSchema,
    sqlBlockMetadataSchema,
    inputTextBlockMetadataSchema,
    inputTextareaBlockMetadataSchema,
    inputCheckboxBlockMetadataSchema,
    inputSelectBlockMetadataSchema,
    inputSliderBlockMetadataSchema,
    inputFileBlockMetadataSchema,
    inputDateBlockMetadataSchema,
    inputDateRangeBlockMetadataSchema,
    buttonBlockMetadataSchema,
    visualizationBlockMetadataSchema,
    bigNumberBlockMetadataSchema,
    textBlockMetadataSchema,
    todoTextBlockMetadataSchema,
    calloutTextBlockMetadataSchema,
    imageBlockMetadataSchema,
    markdownCellMetadataSchema,
    separatorBlockMetadataSchema,
  ])
  .or(z.record(z.unknown())) // Fallback for unknown block types - still better than z.any()
