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
            let textureAtlasSubMetas = selectionMeta.subMetas;
            if (selectionMeta.importer !=  'sprite-atlas' || !textureAtlasSubMetas) {
                Editor.Dialog.error("请先选择图集文件");
                return;
            }
            let textureUuid =  selectionMeta.userData.textureUuid as string
            let fileuuid = textureUuid.split('@')[0]
            let textureAtlasPath = await Editor.Message.request("asset-db","query-path", fileuuid)
            if (!textureAtlasPath) {
                Editor.Dialog.error("未找到图集路径");
                return;
            }
            let extractedImageSaveFolder = Editor.Utils.Path.join(Editor.Project.tmpDir, 'unpacktexture', Editor.Utils.Path.basenameNoExt(textureAtlasPath));
            Fs.mkdirSync(extractedImageSaveFolder,{recursive: true})
            let count = 0
            for(let spriteFrameName in textureAtlasSubMetas) {
                let spriteFrameObj = textureAtlasSubMetas[spriteFrameName];
                let userData = spriteFrameObj.userData;
                let isRotated = userData.rotated;
                let spriteRect = {x: userData.trimX,y: userData.trimY, width: userData.width,height: userData.height};
                let extendTop = Math.ceil((userData.rawHeight - spriteRect.height) / 2 - userData.offsetY);
                let extendBottom = Math.ceil(userData.offsetY + (userData.rawHeight - spriteRect.height) / 2);
                let extendLeft = Math.ceil(userData.offsetX + (userData.rawWidth - spriteRect.width) / 2);
                let extendRight = Math.ceil((userData.rawWidth - spriteRect.width) / 2 - userData.offsetX);
                let extractedSmallPngSavePath = Editor.Utils.Path.join(extractedImageSaveFolder, `${spriteFrameObj.name}.png`);
                await sharp(textureAtlasPath).extract({ left: spriteRect.x, top: spriteRect.y, width: isRotated ? spriteRect.height : spriteRect.width, height: isRotated ? spriteRect.width : spriteRect.height })
                    .extend({ top: extendTop, bottom: extendBottom, left: extendLeft, right: extendRight })
                    .rotate(isRotated ? 270 : 0)
                    .toFile(extractedSmallPngSavePath);
                count++;
            }
            Editor.Dialog.info(`图片导出完成,共导出${count}张图片`);
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
