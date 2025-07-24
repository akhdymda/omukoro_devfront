import '@testing-library/jest-dom'

// Mock for file uploads in tests
global.File = class MockFile {
  constructor(parts, filename, properties = {}) {
    this.parts = parts
    this.name = filename
    this.size = parts.reduce((total, part) => total + (typeof part === 'string' ? part.length : part.size || 0), 0)
    this.type = properties.type || ''
    this.lastModified = properties.lastModified || Date.now()
  }
}

// Mock FileList for drag and drop testing
global.FileList = class MockFileList extends Array {
  constructor(...files) {
    super(...files)
    Object.defineProperty(this, 'length', {
      value: files.length,
      writable: false
    })
  }
  
  item(index) {
    return this[index] || null
  }
}

// Mock for window.alert used in the component
global.alert = jest.fn()