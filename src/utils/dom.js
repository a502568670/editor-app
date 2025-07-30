const parser = new DOMParser();

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

export function format_to_wangEditor_html (html) {
  console.log("to format:", html)
  const reg01 = /<section/g, reg02 = /section>/g, reg03 = /data-src/g, reg04 = /&quot;/g
  const replace01 = "<p", replace02 = "p>", replace03 = "src", replace04 = ""
  // const replaceTag = "div"
  const reg1 = /<p([^>]*)>(<br\/?>)<\/p>/g, reg2 = /<p\s+\bstyle(?:="[^"]*")?\s*><br(\/)?><\/p>/g, reg3 = /(<p)([^>]*)>(<br\/?>)(<\/p>)/g;
  const reg4 = /data-src/g, reg5 = /&quot;/g
  const replace1 = "<p data-p-br>$1<\/p>", replace2 = "<p data-p-br><br\/><\/p>", replace3 = "<p$2 data-p-br>$3<\/p>"
    // const replaceTag = "div"
  let formated = html
    .replaceAll(reg01, replace01)
    .replaceAll(reg02, replace02)
    .replaceAll(reg03, replace03)
    .replaceAll(reg04, replace04)
    // .replaceAll(reg1, "")
    // .replaceAll(reg2, "")
    console.log("formated1========>>>>", formated)
  formated = formated.replaceAll(reg1, "").replaceAll(reg2, "")
    // .replaceAll(reg3, replace3)
  //   .replaceAll(reg3, "src")
  //   .replaceAll(reg4, "");
  console.log("========>>>>")
  // console.log("formated2=>", formated);
  return formated
}



export function restore_from_wangEditor_html (html) {
  // console.log("to restore:", html)
  const reg01 = /(<p data-section)([^>]*)>(<br\/?>)(<\/p>)/g
  const replace01 = "<section$2>$3<\/section>"
  // const replaceTag = "div"
  const reg1 = /<p data-p-br>(<br\/?>)<\/p>/g, reg2 = /(<p)([^>]*) data-p-br>(<br\/?>)(<\/p>)/g

  const replace1 = "<p>$1<\/p>", replace2 = "<p$2>$3<\/p>"
    // const replaceTag = "div"
  let restored = html
    .replaceAll(reg01, replace01)
    .replaceAll(reg1, replace1)
    .replaceAll(reg2, replace2)
  //   .replaceAll(reg3, "src")
  //   .replaceAll(reg4, "");
  console.log("restored=>", restored);
  return restored
}

export function format_to_UEditor_html (html) {
  
  const reg03 = /data-src/g, reg04 = /&quot;/g
  const  replace03 = "src", replace04 = ""
  // const replaceTag = "div"
  const reg1 = /<p([^>]*)>(<br\/?>)<\/p>/g, reg2 = /<p\s+\bstyle(?:="[^"]*")?\s*><br(\/)?><\/p>/g, reg3 = /(<p)([^>]*)>(<br\/?>)(<\/p>)/g;
  const reg4 = /data-src/g, reg5 = /&quot;/g
  const replace1 = "<p data-p-br>$1<\/p>", replace2 = "<p data-p-br><br\/><\/p>", replace3 = "<p$2 data-p-br>$3<\/p>"
    // const replaceTag = "div"
  // /prase_html_to_json?api_key 解析接口应该已经将data-src copy src
  let formated = html
  if (!/src/g.test(formated)){
    //没找到src
    formated = formated.replaceAll(reg03, replace03)
  }
  formated = formated.replaceAll(reg04, replace04)
    // .replaceAll(reg1, "")
    // .replaceAll(reg2, "")
    // console.log("formated1========>>>>", formated)
  // formated = formated.replaceAll(reg1, "").replaceAll(reg2, "")
    // .replaceAll(reg3, replace3)
  //   .replaceAll(reg3, "src")
  //   .replaceAll(reg4, "");
  // console.log("========>>>>")
  // console.log("formated2=>", formated);
  return formated
}

export function clearContentUrl(raw_text) {
  // match a with specific class
  // const reg = /<a\b[^>]*\bclass\s*=\s*["'][^"']*\bnormal_text_link\b[^"']*["'][^>]*>.*?<\/a>/gi

  // match a not contain class name
  // const reg = /<a\b[^>]*\bclass\s*=\s*["'][^"']*(?!\bnormal_text_link\b)[^"']*["'][^>]*>.*?<\/a>/gi;

  // match a not contain class name1 or name2
  // const reg = /<a\b[^>]*\bclass\s*=\s*["'][^"']*(?!.*\b(?:normal_text_link1|normal_text_link2)\b)[^"']*["'][^>]*>.*?<\/a>/gi;

  // match a must not have href prop
  // const reg = /<a\b(?![^>]*\bhref\s*=\s*["'][^"']*["'])[^>]*>(?:.*?)<\/a>/gi;

  // match a must have href prop
  const reg = /<a\b(?=[^>]*\bhref\s*=\s*["'][^"']*["'])[^>]*>(?:.*?)<\/a>/gi;
  // const reg = /<a\b[^>]*>.*?<\/a>/gi 
  const text = raw_text.replaceAll(reg, "")
  // console.log("text:", text)
  return text
}

export function clearWeApp(raw_text) {
  const reg = /<a\b[^>]*\bclass\s*=\s*["'][^"']*\bjs_weapp_entry\b[^"']*["'][^>]*>.*?<\/a>/gi
  const text = raw_text.replaceAll(reg, "")
  // console.log("text:", text)
  return text
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
