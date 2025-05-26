export function getVideoFrameHtml(vid, cdn_url) {
  return `<iframe class="edui-video-iframe" data-vidtype="2" data-mpvid="${vid}" data-cover="${cdn_url}" allowfullscreen="" frameborder="0" data-w="1080" data-ratio="0.5625" style="border-radius: 4px;" src="https://mp.weixin.qq.com/cgi-bin/readtemplate?t=tmpl/video_tmpl&vid=${vid}" width="100%"  frameborder="0" allowfullscreen=""></iframe>`
}