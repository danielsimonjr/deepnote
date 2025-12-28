import { dedent } from 'ts-dedent'
import { describe, expect, it } from 'vitest'

import {
  createPythonCodeForInputCheckboxBlock,
  createPythonCodeForInputDateBlock,
  createPythonCodeForInputDateRangeBlock,
  createPythonCodeForInputFileBlock,
  createPythonCodeForInputSelectBlock,
  createPythonCodeForInputSliderBlock,
  createPythonCodeForInputTextareaBlock,
  createPythonCodeForInputTextBlock,
  type InputCheckboxBlock,
  type InputDateBlock,
  type InputDateRangeBlock,
  type InputFileBlock,
  type InputSelectBlock,
  type InputSliderBlock,
  type InputTextareaBlock,
  type InputTextBlock,
  isValidAbsoluteDateRange,
  isValidDate,
  isValidDateRangeOrder,
} from './input-blocks'

describe('createPythonCodeForInputTextBlock', () => {
  it('creates Python code for input text block', () => {
    const block: InputTextBlock = {
      id: '123',
      type: 'input-text',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_input',
        deepnote_variable_value: 'Hello World',
      },
    }

    const result = createPythonCodeForInputTextBlock(block)

    expect(result).toEqual("my_input = 'Hello World'")
  })

  it('escapes special characters', () => {
    const block: InputTextBlock = {
      id: '123',
      type: 'input-text',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_input',
        deepnote_variable_value: 'It\'s a "test"',
      },
    }

    const result = createPythonCodeForInputTextBlock(block)

    expect(result).toEqual("my_input = 'It\\'s a \"test\"'")
  })
})

describe('createPythonCodeForInputTextareaBlock', () => {
  it('creates Python code for input textarea block', () => {
    const block: InputTextareaBlock = {
      id: '123',
      type: 'input-textarea',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_text',
        deepnote_variable_value: 'Multi\nline\ntext',
      },
    }

    const result = createPythonCodeForInputTextareaBlock(block)

    expect(result).toEqual("my_text = 'Multi\\nline\\ntext'")
  })
})

describe('createPythonCodeForInputCheckboxBlock', () => {
  it('creates Python code for checked checkbox', () => {
    const block: InputCheckboxBlock = {
      id: '123',
      type: 'input-checkbox',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_checkbox',
        deepnote_variable_value: true,
      },
    }

    const result = createPythonCodeForInputCheckboxBlock(block)

    expect(result).toEqual('my_checkbox = True')
  })

  it('creates Python code for unchecked checkbox', () => {
    const block: InputCheckboxBlock = {
      id: '123',
      type: 'input-checkbox',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_checkbox',
        deepnote_variable_value: false,
      },
    }

    const result = createPythonCodeForInputCheckboxBlock(block)

    expect(result).toEqual('my_checkbox = False')
  })
})

describe('createPythonCodeForInputSelectBlock', () => {
  it('creates Python code for single value select', () => {
    const block: InputSelectBlock = {
      id: '123',
      type: 'input-select',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_select',
        deepnote_variable_value: 'Option 1',
      },
    }

    const result = createPythonCodeForInputSelectBlock(block)

    expect(result).toEqual("my_select = 'Option 1'")
  })

  it('creates Python code for multiple values select', () => {
    const block: InputSelectBlock = {
      id: '123',
      type: 'input-select',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_select',
        deepnote_variable_value: ['Option 1', 'Option 2'],
        deepnote_allow_multiple_values: true,
      },
    }

    const result = createPythonCodeForInputSelectBlock(block)

    expect(result).toEqual("my_select = ['Option 1', 'Option 2']")
  })

  it('creates Python code for empty select', () => {
    const block: InputSelectBlock = {
      id: '123',
      type: 'input-select',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_select',
        deepnote_variable_value: '',
        deepnote_allow_multiple_values: false,
      },
    }

    const result = createPythonCodeForInputSelectBlock(block)

    expect(result).toEqual('my_select = None')
  })
})

describe('createPythonCodeForInputSliderBlock', () => {
  it('creates Python code for slider block', () => {
    const block: InputSliderBlock = {
      id: '123',
      type: 'input-slider',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_slider',
        deepnote_variable_value: '42',
      },
    }

    const result = createPythonCodeForInputSliderBlock(block)

    expect(result).toEqual('my_slider = 42')
  })
})

describe('createPythonCodeForInputFileBlock', () => {
  it('creates Python code for file block with value', () => {
    const block: InputFileBlock = {
      id: '123',
      type: 'input-file',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_file',
        deepnote_variable_value: '/path/to/file.csv',
      },
    }

    const result = createPythonCodeForInputFileBlock(block)

    expect(result).toEqual("my_file = '/path/to/file.csv'")
  })

  it('creates Python code for file block without value', () => {
    const block: InputFileBlock = {
      id: '123',
      type: 'input-file',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_file',
        deepnote_variable_value: '',
      },
    }

    const result = createPythonCodeForInputFileBlock(block)

    expect(result).toEqual('my_file = None')
  })
})

describe('createPythonCodeForInputDateBlock', () => {
  it('creates Python code for date block version 2', () => {
    const block: InputDateBlock = {
      id: '123',
      type: 'input-date',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_date',
        deepnote_variable_value: '2024-01-15',
        deepnote_input_date_version: 2,
      },
    }

    const result = createPythonCodeForInputDateBlock(block)

    expect(result).toEqual(dedent`

      from dateutil.parser import parse as _deepnote_parse
      my_date = _deepnote_parse('2024-01-15').date()

    `)
  })

  it('creates Python code for empty date block', () => {
    const block: InputDateBlock = {
      id: '123',
      type: 'input-date',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_date',
        deepnote_variable_value: '',
      },
    }

    const result = createPythonCodeForInputDateBlock(block)

    expect(result).toEqual(dedent`

      my_date = None

    `)
  })
})

describe('createPythonCodeForInputDateRangeBlock', () => {
  it('creates Python code for absolute date range', () => {
    const block: InputDateRangeBlock = {
      id: '123',
      type: 'input-date-range',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_range',
        deepnote_variable_value: ['2024-01-01', '2024-12-31'],
      },
    }

    const result = createPythonCodeForInputDateRangeBlock(block)

    expect(result).toEqual(dedent`
      from dateutil.parser import parse as _deepnote_parse
      my_range = [_deepnote_parse('2024-01-01').date(), _deepnote_parse('2024-12-31').date()]
    `)
  })

  it('creates Python code for past 7 days range', () => {
    const block: InputDateRangeBlock = {
      id: '123',
      type: 'input-date-range',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_range',
        deepnote_variable_value: 'past7days',
      },
    }

    const result = createPythonCodeForInputDateRangeBlock(block)

    expect(result).toEqual(dedent`
      from datetime import datetime as _deepnote_datetime, timedelta as _deepnote_timedelta
      my_range = [_deepnote_datetime.now().date() - _deepnote_timedelta(days=7), _deepnote_datetime.now().date()]
    `)
  })

  it('creates Python code for custom days range', () => {
    const block: InputDateRangeBlock = {
      id: '123',
      type: 'input-date-range',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my_range',
        deepnote_variable_value: 'customDays30',
      },
    }

    const result = createPythonCodeForInputDateRangeBlock(block)

    expect(result).toEqual(dedent`
      from datetime import datetime, timedelta
      my_range = [datetime.now().date() - timedelta(days=30), datetime.now().date()]
    `)
  })
})

describe('isValidDate', () => {
  it('returns true for valid dates', () => {
    expect(isValidDate('2024-01-15')).toBe(true)
    expect(isValidDate('2024-12-31')).toBe(true)
    expect(isValidDate('2020-02-29')).toBe(true) // Leap year
  })

  it('returns true for empty string', () => {
    expect(isValidDate('')).toBe(true)
  })

  it('returns false for invalid date format', () => {
    expect(isValidDate('01-15-2024')).toBe(false)
    expect(isValidDate('2024/01/15')).toBe(false)
    expect(isValidDate('Jan 15, 2024')).toBe(false)
  })

  it('returns false for invalid dates', () => {
    expect(isValidDate('2024-02-30')).toBe(false) // Feb 30 doesn't exist
    expect(isValidDate('2024-13-01')).toBe(false) // Month 13 doesn't exist
    expect(isValidDate('2024-00-15')).toBe(false) // Month 0 doesn't exist
    expect(isValidDate('2023-02-29')).toBe(false) // 2023 is not a leap year
  })
})

describe('isValidDateRangeOrder', () => {
  it('returns true when start is before end', () => {
    expect(isValidDateRangeOrder('2024-01-01', '2024-12-31')).toBe(true)
  })

  it('returns true when start equals end', () => {
    expect(isValidDateRangeOrder('2024-06-15', '2024-06-15')).toBe(true)
  })

  it('returns false when start is after end', () => {
    expect(isValidDateRangeOrder('2024-12-31', '2024-01-01')).toBe(false)
  })

  it('returns true for empty dates', () => {
    expect(isValidDateRangeOrder('', '2024-12-31')).toBe(true)
    expect(isValidDateRangeOrder('2024-01-01', '')).toBe(true)
    expect(isValidDateRangeOrder('', '')).toBe(true)
  })
})

describe('isValidAbsoluteDateRange', () => {
  it('returns true for valid date ranges', () => {
    expect(isValidAbsoluteDateRange(['2024-01-01', '2024-12-31'])).toBe(true)
    expect(isValidAbsoluteDateRange(['2024-06-15', '2024-06-15'])).toBe(true)
  })

  it('returns true for empty date values in range', () => {
    expect(isValidAbsoluteDateRange(['', '2024-12-31'])).toBe(true)
    expect(isValidAbsoluteDateRange(['2024-01-01', ''])).toBe(true)
    expect(isValidAbsoluteDateRange(['', ''])).toBe(true)
  })

  it('returns false for non-array values', () => {
    expect(isValidAbsoluteDateRange('2024-01-01' as unknown as [string, string])).toBe(false)
    expect(isValidAbsoluteDateRange(null as unknown as [string, string])).toBe(false)
  })

  it('returns false for arrays with wrong length', () => {
    expect(isValidAbsoluteDateRange(['2024-01-01'] as unknown as [string, string])).toBe(false)
    expect(isValidAbsoluteDateRange(['2024-01-01', '2024-06-15', '2024-12-31'] as unknown as [string, string])).toBe(
      false
    )
  })

  it('returns false for invalid dates in range', () => {
    expect(isValidAbsoluteDateRange(['2024-02-30', '2024-12-31'])).toBe(false) // Invalid start date
    expect(isValidAbsoluteDateRange(['2024-01-01', '2024-13-01'])).toBe(false) // Invalid end date
  })

  it('returns false when start is after end', () => {
    expect(isValidAbsoluteDateRange(['2024-12-31', '2024-01-01'])).toBe(false)
  })
})
