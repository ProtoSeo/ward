class Singleton {

  constructor(height, width) {
    if (Singleton.instance) {
      return Singleton.instance;
    }
    this.height = height;
    this.width = width;
    Singleton.instance = this;
  }

  getArea() {
    return this.height * this.width;
  }
}

function isSame() {
  const a = new Singleton(10, 11);
  const b = new Singleton(5, 1);
  console.log(a.getArea() === 110);
  console.log(b.getArea() === 110);
  console.log(a === b);
}

isSame();
