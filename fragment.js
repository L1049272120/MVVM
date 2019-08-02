
class Dep{
    constructor () {
        this.events = [];
    }
    addWatcher (watcher) {
        this.events.push(watcher)
    }
    touchWatchers () {
        this.events.forEach(item => {
            item.targetCbk()
        })
    }
}
Dep.target = null
let dep = new Dep()

class Observer {
    constructor (data) {
        if (!data || typeof data !== 'object') {
            return;
        }
        this.data = data;
        this.init()
    }
    init () {
        Object.keys(this.data).forEach(key => {
            this.observer(this.data, key, this.data[key])
        })
    }
    observer (obj, key, value) {
        new Observer(obj[key])
        Object.defineProperty(obj, key, {
            get () {
                if (Dep.target) {
                    dep.addWatcher(Dep.target)
                }
                return value
            },
            set (newValue) {
                if (value === newValue) {
                    return;
                }
                value = newValue
                dep.touchWatchers()
                new Observer(value)
            }
        })
    }
}



class Watcher{
    constructor (data, key, cbk) {
        this.data = data;
        this.key = key;
        this.cbk = cbk;
        Dep.target = this;
        this.init ()
    }
    init () {
        this.value = utils.getDataValue(this.key, this.data)
        Dep.target = null
        return this.value
    }
    targetCbk () {
        let value = this.init()
        this.cbk(value)
    }
}
const utils = {
    setValue (node,key,data,content) {
        node[content] = this.getDataValue(key,data)
    },
    getDataValue (key,data) {
        if (key.indexOf('.') > -1) {
            let arr = key.split('.')
            for(let i = 0; i < arr.length; i++) {
                data = data[arr[i]]
            }
            return data
        }
        else {
            return data[key]
        }
    },
    changeValue (data, key, newValue) {
        if (key.indexOf('.') > -1) {
            let arr = key.split('.')
            for(let i = 0; i < arr.length - 1; i++) {
                data = data[arr[i]]
            }
            data[arr[arr.length-1]] = newValue
        }
        else {
            data[key] = newValue
            console.log(data[key])
        }
    }
}

class MVVM{
    constructor ({el,data}) {
        this.$el = document.getElementById(el) //获取所有元素
        this.data = data; //获取所有数据
        this.bindDom()
        this.initDom ()  //默认调用
    }
    // data属性放在this
    bindDom () {
        Object.keys(this.data).forEach(key => {
            this.Observer(this, key, this.data[key])
        })
        new Observer(this.data)
    }
    Observer (obj, key, value) {
        Object.defineProperty(obj, key, {
            get () {
                return value
            },
            set (newValue) {
                value = newValue
            }
        })
    }
    initDom () {
        let newFragment = this.createFragment()  //碎片流创建  碎片流相当于一虚拟dom  然后一次性绘制到页面
        this.complier(newFragment)  // 调用函数 
        this.$el.appendChild(newFragment)   //添加到页面
    }
    createFragment () {  //操作碎片流 将对象中的元素添加到碎片流
        let fragment = document.createDocumentFragment()
        let firstEl
        while (firstEl = this.$el.firstChild) {   //循环将对象内第一个元素 都存入碎片流
            fragment.appendChild(firstEl)
        }
        return fragment    //返回碎片流
    }
    complier (node) {
        //判断元素的nodeType
        // console.log(node)
        if (node.nodeType === 1) {  //判断属性有v-model
            let attributes = node.attributes;
                [...attributes].forEach(val => {
                    if (val.nodeName === 'v-model') {
                        node.addEventListener('input',(target) => { //input事件
                            utils.changeValue(this.data,val.nodeValue,target.target.value)
                        })
                        utils.setValue(node,val.nodeValue,this.data,'value')
                    }
                })
        }
        else if (node.nodeType === 3) {
            if (node.textContent.indexOf('{{') > -1) {
                let content = node.textContent.split('{{')[1].split('}}')[0]
                // console.log(content)
                content && utils.setValue(node,content,this.data,'textContent')
                content && new Watcher(this.data, content, (value) => {
                    node.textContent = value;
                })
            }
        }
        //碎片流中有子元素  里面再进行递归  直到没有
        if (node.childNodes && node.childNodes.length > 0) {
            node.childNodes.forEach(val => {
                this.complier(val)
            })
        }
    }
}
