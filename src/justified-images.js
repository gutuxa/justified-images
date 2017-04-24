const justifiedImages = ({ container, ...optns }) => {
  let template = ({ displayHeight, displayWidth, marginRight, src }) => `
    <div class="photo-container" style="height:${ displayHeight }px;margin-right:${ marginRight }px;">
      <img class="image-thumb" src="${ src }" style="width:${ displayWidth }px;height:${ displayHeight }px;" >
    </div>
  `

  let options = {}

  init()

  function toArray(input) {
    return Array.prototype.slice.call(input)
  }

  function mergeOptions(options) {
    return {
      ...{
        appendBlocks: () => [],
        rowHeight: 150,
        maxRowHeight: 350,
        handleResize: false,
        margin: 1,
        imageSelector: 'image-thumb',
        imageContainer: 'photo-container'
      },
      ...options
    }
  }

  function init() {
    options = mergeOptions(optns)
    displayImages()
    handleResize && handleResize()
  }

  function displayImages() {
    let rowNum = 0
    let baseLine = 0
    let limit = options.images.length
    let photos = options.images
    let rows = []
    let totalWidth = 0
    let appendBlocks = options.appendBlocks()
    let d = container
    let w = d.getBoundingClientRect().width
    let border = parseInt(options.margin, 10)
    let h = parseInt(options.rowHeight, 10)

    let ws = toArray(options.images).map(image => {
      let size = options.getSize(image)
      let wt = parseInt(size.width, 10)
      let ht = parseInt(size.height, 10)

      if (ht !== h) {
        wt = Math.floor(wt * (h / ht))
      }

      totalWidth += wt

      return wt
    })

    appendBlocks.forEach(block => {
      totalWidth += block.width
    })

    let perRowWidth = totalWidth / Math.ceil(totalWidth / w)

    console.log('rows', Math.ceil(totalWidth / w))

    let tw = 0

    while (baseLine < limit) {
      let row = {
        width: 0,
        photos: []
      }
      let c = 0
      let block = getBlockInRow(rows.length + 1)

      if (block) {
        row.width += block.width
        tw += block.width
      }

      while ((tw + ws[baseLine + c] / 2 <= perRowWidth * (rows.length + 1)) && (baseLine + c < limit)) {
        tw += ws[baseLine + c]
        row.width += ws[baseLine + c]
        row.photos.push({
            width: ws[baseLine + c],
            photo: photos[baseLine + c]
        })
        c++
      }
      baseLine += c;
      rows.push(row)
    }

    console.log(rows.length, rows)

    rows.forEach((row, i) => {
      let lastRow = i === rows.length - 1
      rowNum = i + 1

      if (options.maxRows && rowNum > options.maxRows) return

      tw = -1 * border

      let newBlock = getBlockInRow(lastRow ? -1 : rowNum)
      let availableRowWidth = w

      if (newBlock) {
        availableRowWidth -= newBlock.width
        tw = 0
      }

      // Ratio of actual width of row to total width of images to be used.
      let r = availableRowWidth / row.width //Math.min(w / row.width, this.options.maxScale),
      let c = row.photos.length

      // new height is not original height * ratio
      let ht = Math.min(Math.floor(h * r), parseInt(options.maxRowHeight, 10))
      r = ht / options.rowHeight
      let domRow = document.createElement('div')
      domRow.classList.add('picrow')
      domRow.style.height = `${ ht + border }px`
      d.append(domRow)

      let imagesHtml = ''

      row.photos.forEach((photos, j) => {
        // Calculate new width based on ratio
        let { photo, width } = photos

        let wt = Math.floor(width * r)
        tw += wt + border

        imagesHtml += renderPhoto(
          photo,
          {
            src: options.thumbnailPath(photo, wt, ht),
            width: wt,
            height: ht
          },
          newBlock ? false : j === row.photos.length - 1
        )
      })

      if (imagesHtml === '') {
          domRow.remove()
          return
      }

      domRow.innerHTML = imagesHtml

      if ((Math.abs(tw - availableRowWidth) < 0.05 * availableRowWidth)) {
        // if total width is slightly smaller than
        // actual div width then add 1 to each
        // photo width till they match
        let k = 0

        while (tw < availableRowWidth) {
          let div1 = domRow.querySelector(`.${ options.imageContainer }:nth-child(${ k + 1 })`)
          let img1 = div1.querySelector(`.${ options.imageSelector }`)
          img1.style.width = `${ parseInt(img1.style.width) + 1 }px`
          k = (k + 1) % c
          tw++
        }

        // if total width is slightly bigger than
        // actual div width then subtract 1 from each
        // photo width till they match
        k = 0

        while (tw > availableRowWidth) {
          let div2 = domRow.querySelector(`.${ options.imageContainer }:nth-child(${ k + 1 })`)
          let img2 = div2.querySelector(`.${ options.imageSelector }`)
          img2.style.width = `${ parseInt(img2.style.width) - 1 }px`
          k = (k + 1) % c
          tw--
        }
      } else {
        if ( availableRowWidth - tw > 0.05 * availableRowWidth ) {
          let diff = availableRowWidth - tw
          let adjustedDiff = 0
          let images = domRow.querySelectorAll(`.${ options.imageContainer }`)
          let marginTop = 0

          toArray(images).forEach(imgDiv => {
            let currentDiff = diff / (images.length)
            let img = imgDiv.querySelector(`.${ options.imageSelector }`)
            let imageWidth = parseInt(img.style.width)
            let imageHeight = parseInt(img.style.height)

            if ( i === images.length - 1 ) {
                currentDiff = diff - adjustedDiff
            }
            img.style.width = `${ imageWidth + currentDiff }px`
            img.style.height = `${ ( imageHeight / imageWidth ) * ( imageWidth + currentDiff ) }px`
            marginTop = (imageHeight - parseInt(img.style.height)) / 2
            img.style.marginTop = `${ marginTop }px`
            adjustedDiff += currentDiff
          })
        }
      }

      if (newBlock) {
        let block = document.createElement('div')
        block.classList.add(`${ options.imageContainer } added-block`)
        block.style.width = `${ newBlock.width }px`
        block.style.height = `${ ht }px`

        domRow.appendChild(block)
      }
    })
  }

  function getBlockInRow(rowNum) {
    let appendBlocks = options.appendBlocks()
    appendBlocks.forEach(block => {
      if (block.rowNum === rowNum){
        return block
      }
    })
  }

  function handleResize() {}

  function renderPhoto(image, obj, isLast) {
    let data = {}
    let d

    d = {
      ...{
        src: image.getAttribute('src'),
        width: image.width,
        height: image.height
      },
      src: obj.src,
      displayWidth: obj.width,
      displayHeight: obj.height,
      marginRight: isLast ? 0 : options.margin
    }

    if (options.dataObject) {
      data[options.dataObject] = d
    } else {
      data = d
    }

    return template(data)
  }

  function refresh(optns) {
    options = mergeOptions(optns)
    container.innerHTML = ''
    displayImages()
  }
}

export default (options) => {
  return new justifiedImages(options)
}