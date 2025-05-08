
export function hasValidImageTag(str) {
  // 正则表达式匹配img标签
  const imgPattern = /<img[^>]*src=["'](.*?)["']/i;

  // 使用match方法查找匹配项
  const match = str.match(imgPattern);

  // 如果找到匹配项并且src属性不为空，返回true；否则返回false
  return match && match[1];
}

export function convert2ValidHtml (html) {
  if (!html) {
    return '';
  }
  // // 不能正确识别font
  // html = html.replace(/<font/gi, '<div').replace(/<\/font>/gi, '</div>');
  try {
    // 使用DOMParser将HTML字符串解析为DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 获取所有的img标签
      const imgs = doc.getElementsByTagName('img');

      // 遍历所有的img标签
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];

        // 检查img标签是否存在
        if (!img) {
          continue;
        }

        // 检查src是否以http或https开头
        const src = img.getAttribute('src');
        if (!src || !/^https?:\/\//.test(src)) {
          console.log('src未识别', src);
          continue;
        }

        let imgNode = doc.createElement('img');
        imgNode.src = img.src;
        // 将img标签放入p标签中
        let pNode = doc.createElement('p');

        // 获取img标签的直接父级，即p标签
        let imgFirstParentNode = img.parentNode;
        // 检查img标签的直接父级是否存在，不存在则将该节点包裹一个p
        if (!imgFirstParentNode) {
          pNode.appendChild(imgNode);
          img.replaceWith(pNode);
          continue;
        }

        //找父级标签，直到找到body节点 如div
        let lastParentNode = img.parentNode;
        while (imgFirstParentNode && imgFirstParentNode.tagName.toLowerCase() != 'body') {
          console.log('处理之前imgFirstParentNode==', imgFirstParentNode);
          if (imgFirstParentNode.tagName.toLowerCase() == 'p') {
            // 如果是p标签，直接将img标签替换为p标签，也可以不处理，editor对p可以识别
            pNode.appendChild(imgNode);
            img.replaceWith(pNode);
            imgFirstParentNode = imgFirstParentNode.parentNode;
            continue;
          }
          // 处理wangEditor的标签
          if (imgFirstParentNode.tagName.toLowerCase() == 'div' || imgFirstParentNode.tagName.toLowerCase() == 'a' || imgFirstParentNode.tagName.toLowerCase() == 'span') {
            //如果是有文字的，父级被替换前，将文字放到一个新的p标签
            if (imgFirstParentNode.innerText) {
              let spanNode = doc.createElement('span');
              spanNode.innerText = imgFirstParentNode.innerText;
              pNode.appendChild(spanNode);
            }
          }

          //当前节点的父节点已经是body节点 <body><div><img></div></body>
          if (imgFirstParentNode.parentNode) {
            if (imgFirstParentNode.parentNode.tagName.toLowerCase() == 'body') {
              console.log('当前节点的父节点已经是body节点imgFirstParentNode', imgFirstParentNode);
              lastParentNode = imgFirstParentNode;
              break;
            } else if (imgFirstParentNode.parentNode.tagName.toLowerCase() == 'div' || imgFirstParentNode.parentNode.tagName.toLowerCase() == 'span') {
              //这时想要对嵌套多层div的进行处理,获取包裹img标签的div的兄弟节点，如果兄弟很多，则不方便如此处理，直接正则全局处理，不要样式
              let imgParentBrothers = imgFirstParentNode.parentNode.childNodes;
              if (imgParentBrothers.length > 1) {
                console.log('img所在div兄弟很多，则不方便如此处理，直接正则全局处理');
                return html
                  .replace(/<span/gi, '<p')
                  .replace(/<\/span>/gi, '</p>')
                  .replace(/<div/gi, '<p')
                  .replace(/<\/div>/gi, '</p>')
                  .replace(/<a/gi, '<p')
                  .replace(/<\/a>/gi, '</p>')
                  .replace(/<font/gi, '<span')
                  .replace(/<\/font>/gi, '</span>'); //font标签替换成div，有显示问题，再替换为span标签，解决报错问题
              }
            }
          }
          // 检查父节点的父节点 <body><div><div><img></div></div></body>
          imgFirstParentNode = imgFirstParentNode.parentNode;
          if (imgFirstParentNode.parentNode && imgFirstParentNode.parentNode.tagName.toLowerCase() == 'body') {
            console.log('节点的父节点的父节点已经是body节点imgFirstParentNode', imgFirstParentNode);
            lastParentNode = imgFirstParentNode;
          }
          console.log('处理之后imgFirstParentNode==', imgFirstParentNode);
        }
        console.log('lastParentNodee==', imgFirstParentNode);
        pNode.appendChild(imgNode);
        lastParentNode.replaceWith(pNode);
      }
      return doc.documentElement.innerHTML
        .replace(/<head><\/head>/gi, '')
        .replace(/<body>/gi, '')
        .replace(/<\/body>/gi, '')
        .replace(/<p><\/p>/gi, '')
        .replace(/<font/gi, '<span')
        .replace(/<\/font>/gi, '</span>');
    } catch (error) {
      console.log('转换失败:', error);
    }
    // 或者其他适当的默认值
    return html;
}


// await navigator.clipboard.write([
      //   new window.ClipboardItem({
      //     'text/html': new Blob([content_noencode], { type: 'text/html' }),
      //     'text/plain': new Blob([content_noencode], { type: 'text/plain' }),
      //   }),
      // ]);

      // // console.log('rawExtractContent=>', rawExtractContent)
      // const reg1 = /<p/g, reg2 = /p>/g, reg3 = /data-src/g, reg4 = /&quot;/g
      // const replaceTag = "div"
      // let extractContent = content_noencode
      //   .replaceAll(reg1, `<${replaceTag}`)
      //   .replaceAll(reg2, `${replaceTag}>`)
      // //   .replaceAll(reg3, "src")
      // //   .replaceAll(reg4, "");
      // console.log("extractContent1=>", extractContent);

      // const hasImgs = hasValidImageTag(extractContent);
      // console.log('hasImgs', hasImgs);
      // if (hasImgs) {
      //   extractContent = convert2ValidHtml(extractContent);
      // }

       
      // console.log("extractContent2=>", extractContent);


      // titleRef.value = title
      // authorRef.value = nick_name
      // valueHtml.value = "<p>" + extractContent + "<p>"
