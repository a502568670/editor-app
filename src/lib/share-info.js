const toStringSafe = (value) => {
  if (value === undefined || value === null) {
    return undefined
  }
  return String(value)
}

const normalizeReprintUrl = (url) => {
  if (!url) {
    return undefined
  }
  let normalized = url.trim()
  if (!normalized) {
    return undefined
  }
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://')
  }
  if (!normalized.includes('scene=')) {
    const separator = normalized.includes('?') ? '&' : '?'
    normalized = `${normalized}${separator}scene=45`
  }
  if (normalized.endsWith('#rd')) {
    normalized = normalized.replace('#rd', '#wechat_redirect')
  } else if (!normalized.endsWith('#wechat_redirect')) {
    normalized = `${normalized}#wechat_redirect`
  }
  return normalized
}

export const mapShareInfoFromAppmsg = (mi) => {
  if (!mi) {
    return null
  }

  const reprintUrl = normalizeReprintUrl(
    mi.share_copyright_url ||
    mi.source_url ||
    mi.share_page_url ||
    mi.reprint_url
  )

  const shouldBuildShareInfo = Boolean(
    reprintUrl ||
    mi.is_reprint ||
    mi.is_share_copyright
  )

  if (!shouldBuildShareInfo || !reprintUrl) {
    return null
  }

  const shareInfo = {
    platform: mi.copyright_nickname,
    reprint_url: reprintUrl,
    source_username: mi.source_username,
    source_headimg: mi.copyright_headimg,
    guide_words: mi.guide_words || mi.digest,
    copyright_stat: toStringSafe(mi.copyright_stat),
    reprint_style: toStringSafe(mi.reprint_style),
    reprint_type: toStringSafe(mi.reprint_type),
    content_noencode: mi.content
  }

  Object.keys(shareInfo).forEach((key) => {
    if (shareInfo[key] === undefined || shareInfo[key] === null) {
      delete shareInfo[key]
    }
  })

  return shareInfo
}


