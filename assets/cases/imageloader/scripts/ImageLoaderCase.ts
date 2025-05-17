import { ResLoader } from "./core/ResLoader";


const { ccclass, property } = cc._decorator;

const spfUrl1 = 'tex/mrx1111111111111@bundleImageloader';

const prefabUrl1 = 'prefab/prefabSprite@bundleImageloader';

@ccclass
export default class ImageLoaderCase extends cc.Component {

    @property(cc.Sprite)
    sprite: cc.Sprite = null;

    @property(cc.Node)
    pfbParent: cc.Node = null;

    private _dySpf: cc.SpriteFrame = null;
    private _dyPfb: cc.Prefab = null;
    protected start(): void {

    }

    private loadSpf(url) {
        ResLoader.load(url, cc.SpriteFrame).then((asset) => {
            this.sprite.spriteFrame = asset;
            this._dySpf = asset;
        });
    }

    private loadPrefab(url) {
        ResLoader.load(url, cc.Prefab).then((asset) => {
            let node = cc.instantiate(asset);
            this.pfbParent.addChild(node);
            let deps = cc.assetManager.dependUtil.getDeps(asset['_uuid']);
        })
    }

    private onClickBtnLoadSpf() {
        this.loadSpf(spfUrl1);
        //加载完成后，引用计数+1
        this._dySpf.addRef();
    }

    private onClickBtnUnloadSpf() {
        if (this._dySpf) {
            //卸载时，引用计数-1
            //当引用计数为0时，会自动释放资源
            this._dySpf.decRef();
            this._dySpf = null;
        }
    }
}
