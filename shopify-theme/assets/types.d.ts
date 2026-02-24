declare global {
  interface Window {
    Theme: {
      routes: {
        cart_update_url: string;
      };
    };
  }
  
  interface HTMLElement {
    style: CSSStyleDeclaration;
  }
  
  interface Element {
    style: CSSStyleDeclaration;
  }
  
  interface Node {
    querySelector(selector: string): Element | null;
    querySelectorAll(selector: string): NodeListOf<Element>;
    hasAttribute(name: string): boolean;
  }
}

export {};
