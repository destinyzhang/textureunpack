const Fs = require('fs');
const sharp = require('sharp');
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
   async unpacktexture (){
        let currentSelection = Editor.Selection.getSelected(Editor.Selection.getLastSelectedType());
        if (currentSelection.length > 0) {
            let selectionUUid = currentSelection[0];
            let selectionMeta = await Editor.Message.request("asset-db","query-asset-meta", selectionUUid)
            console.log(selectionMeta);
            let assetInfo = await Editor.Message.request("asset-db","query-asset-info", selectionUUid)
            let textureUuid =  selectionMeta.userData.textureUuid as string
            let fileuuid = textureUuid.split('@')[0]
            let textureAtlasPath = await Editor.Message.request("asset-db","query-path", fileuuid)
            if (!textureAtlasPath) {
                Editor.Dialog.error("请先选择图集文件");
                return;
            }
            let textureAtlasSubMetas = selectionMeta.subMetas;
            if (assetInfo.type === 'cc.SpriteAtlas'
                && textureAtlasSubMetas) {
                let extractedImageSaveFolder = Editor.Utils.Path.join(Editor.Project.path, 'temp', Editor.Utils.Path.basenameNoExt(textureAtlasPath) + '_unpack');
                Editor.Utils.Path
                Fs.mkdirSync(extractedImageSaveFolder,{recursive: true})
                for(let spriteFrameName in textureAtlasSubMetas) {
                    let spriteFrameObj = textureAtlasSubMetas[spriteFrameName];
                    let userData = spriteFrameObj.userData;
                    let isRotated = userData.rotated;
                    let originalSize = {width:userData.rawWidth,height: userData.rawHeight};
                    let rect = {x: userData.trimX,y: userData.trimY, width: userData.width,height: userData.height};
                    let offset = {x : userData.offsetX, y:userData.offsetY };
                    let trimmedLeft = Math.ceil(offset.x + (originalSize.width - rect.width) / 2);
                    let trimmedRight = Math.ceil((originalSize.width - rect.width) / 2 - offset.x);
                    let trimmedTop = Math.ceil((originalSize.height - rect.height) / 2 - offset.y);
                    let trimmedBottom = Math.ceil(offset.y + (originalSize.height - rect.height) / 2);
                    let extractedSmallPngSavePath = Editor.Utils.Path.join(extractedImageSaveFolder, `${spriteFrameObj.name}.png`);
                    await sharp(textureAtlasPath).extract({ left: rect.x, top: rect.y, width: rect.height, height: rect.width })
                        .extend({ top: trimmedTop, bottom: trimmedBottom, left: trimmedLeft, right: trimmedRight })
                        .rotate(isRotated ? 270 :0)
                        .toFile(extractedSmallPngSavePath);
                }
                Editor.Dialog.info("图片导出完成");
            } else {
                Editor.Dialog.error("请先选择图集文件");
            }
        } else {
            Editor.Dialog.error("请先选择图集文件");
        }
    },

};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() { }

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() { }
