class MockContext {
    measureText() {
        return { width: 0 };
    }
}
  
class MockCanvas {
    getContext() {
        return new MockContext();
    }
}
  
global.HTMLCanvasElement.prototype.getContext = function() {
    return new MockContext();
};
  
global.document.createElement = function(type) {
    if (type === 'canvas') {
        return new MockCanvas();
    }
    return {};
};