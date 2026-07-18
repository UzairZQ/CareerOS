import AppKit
import AVFoundation
import CoreVideo

let outputDirectory = URL(fileURLWithPath: "/Users/uzair99/Development/CareerOS/artifacts/linkedin-video-2026-07-18")
let outputURL = outputDirectory.appendingPathComponent("careeros-linkedin-demo.mp4")
try? FileManager.default.removeItem(at: outputURL)

let width = 1080
let height = 1350
let frameRate = 30
let sceneDuration = 3.6
let transitionDuration = 0.55

struct Scene {
  let imageName: String
  let eyebrow: String
  let title: String
  let subtitle: String
  let accent: NSColor
}

let scenes: [Scene] = [
  Scene(
    imageName: "00-hero.png",
    eyebrow: "CAREEROS",
    title: "Build your German dream with proof.",
    subtitle: "A calm job-search operating system for international students and early-career developers.",
    accent: NSColor(red: 0.47, green: 0.61, blue: 0.94, alpha: 1)
  ),
  Scene(
    imageName: "01-dashboard.png",
    eyebrow: "ONE CALM CONTROL ROOM",
    title: "Your job search, made visible.",
    subtitle: "Applications, follow-ups, work-hour limits, profile readiness, and skill signals in one view.",
    accent: NSColor(red: 0.36, green: 0.64, blue: 0.76, alpha: 1)
  ),
  Scene(
    imageName: "02-applications.png",
    eyebrow: "APPLICATION DESK",
    title: "Track the opportunity. Catch the follow-up.",
    subtitle: "Keep every role, status, note, and deadline grounded in one practical workflow.",
    accent: NSColor(red: 0.89, green: 0.60, blue: 0.34, alpha: 1)
  ),
  Scene(
    imageName: "03-skill-gap.png",
    eyebrow: "THE EVIDENCE MAP",
    title: "Proof before claims.",
    subtitle: "Required skill → real evidence → confidence → a proof task. No CV-ready skill without evidence.",
    accent: NSColor(red: 0.67, green: 0.52, blue: 0.91, alpha: 1)
  ),
  Scene(
    imageName: "04-cv-check.png",
    eyebrow: "CV INSPECTION",
    title: "See the gap before you apply.",
    subtitle: "Compare a saved CV to the job description and surface honest matches, missing skills, and fixes.",
    accent: NSColor(red: 0.37, green: 0.73, blue: 0.60, alpha: 1)
  ),
  Scene(
    imageName: "05-assistant.png",
    eyebrow: "APPLICATION ASSISTANT",
    title: "Tailor without inventing.",
    subtitle: "Turn proven work into a subtitle, profile angle, bullet idea, and cover-letter USP.",
    accent: NSColor(red: 0.76, green: 0.57, blue: 0.85, alpha: 1)
  ),
  Scene(
    imageName: "01-dashboard.png",
    eyebrow: "CAREEROS",
    title: "A proof-first job search OS.",
    subtitle: "Built with Next.js, TypeScript, Supabase, PostgreSQL, Tailwind CSS, and local-first AI support.",
    accent: NSColor(red: 0.47, green: 0.61, blue: 0.94, alpha: 1)
  )
]

let imageCache: [String: NSImage] = scenes.reduce(into: [:]) { partialResult, scene in
  let url = outputDirectory.appendingPathComponent(scene.imageName)
  if let image = NSImage(contentsOf: url) {
    partialResult[scene.imageName] = image
  }
}

guard imageCache.count >= 6 else {
  fatalError("Missing screenshot assets for the LinkedIn video")
}

func easeOut(_ value: CGFloat) -> CGFloat {
  1 - pow(1 - min(max(value, 0), 1), 3)
}

func drawText(
  _ text: String,
  in rect: CGRect,
  font: NSFont,
  color: NSColor,
  alignment: NSTextAlignment = .left,
  lineSpacing: CGFloat = 0,
  alpha: CGFloat = 1
) {
  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = alignment
  paragraph.lineSpacing = lineSpacing
  paragraph.lineBreakMode = .byWordWrapping
  let attributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: color.withAlphaComponent(alpha),
    .paragraphStyle: paragraph,
    .kern: 0.2
  ]
  NSAttributedString(string: text, attributes: attributes).draw(in: rect)
}

func roundedPath(_ rect: CGRect, radius: CGFloat) -> CGPath {
  CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
}

func drawScene(_ scene: Scene, progress: CGFloat, alpha: CGFloat, context: CGContext) {
  let entry = easeOut(min(progress / 0.45, 1))
  let exit = easeOut(min(max((progress - 0.78) / 0.22, 0), 1))
  let fade = alpha * entry * (1 - exit * 0.24)

  let background = CGGradient(
    colorsSpace: CGColorSpaceCreateDeviceRGB(),
    colors: [
      NSColor(red: 0.045, green: 0.055, blue: 0.08, alpha: fade).cgColor,
      NSColor(red: 0.075, green: 0.08, blue: 0.12, alpha: fade).cgColor,
      scene.accent.withAlphaComponent(0.14 * fade).cgColor
    ] as CFArray,
    locations: [0, 0.58, 1]
  )!
  context.saveGState()
  context.drawLinearGradient(background, start: CGPoint(x: 0, y: height), end: CGPoint(x: width, y: 0), options: [])
  context.restoreGState()

  let margin: CGFloat = 60
  let topInset: CGFloat = 74
  let labelFont = NSFont.monospacedSystemFont(ofSize: 16, weight: .semibold)
  let titleFont = NSFont(name: "Lora", size: 55) ?? NSFont(name: "Georgia", size: 55) ?? NSFont.systemFont(ofSize: 55, weight: .regular)
  let subtitleFont = NSFont.systemFont(ofSize: 21, weight: .regular)

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: true)
  drawText(scene.eyebrow, in: CGRect(x: margin, y: topInset, width: 760, height: 28), font: labelFont, color: scene.accent, alpha: fade)
  drawText(scene.title, in: CGRect(x: margin, y: topInset + 40, width: CGFloat(width) - margin * 2, height: 140), font: titleFont, color: .white, lineSpacing: 2, alpha: fade)
  drawText(scene.subtitle, in: CGRect(x: margin, y: topInset + 185, width: CGFloat(width) - margin * 2, height: 92), font: subtitleFont, color: NSColor(white: 0.8, alpha: 1), lineSpacing: 4, alpha: fade)
  NSGraphicsContext.restoreGraphicsState()

  guard let image = imageCache[scene.imageName], let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return }
  let imageRatio = CGFloat(cgImage.width) / CGFloat(cgImage.height)
  let baseWidth: CGFloat = CGFloat(width) - margin * 2
  let baseHeight = baseWidth / imageRatio
  let zoom = 0.96 + easeOut(progress) * 0.055
  let cardWidth = baseWidth * zoom
  let cardHeight = baseHeight * zoom
  let cardX = (CGFloat(width) - cardWidth) / 2
  let cardY: CGFloat = 430 - easeOut(progress) * 18
  let cardRect = CGRect(x: cardX, y: cardY, width: cardWidth, height: cardHeight)

  context.saveGState()
  context.setShadow(offset: CGSize(width: 0, height: 18), blur: 32, color: NSColor.black.withAlphaComponent(0.55 * fade).cgColor)
  context.setFillColor(NSColor(red: 0.12, green: 0.14, blue: 0.19, alpha: fade).cgColor)
  context.addPath(roundedPath(cardRect.insetBy(dx: -3, dy: -3), radius: 26))
  context.fillPath()
  context.restoreGState()

  context.saveGState()
  context.addPath(roundedPath(cardRect, radius: 23))
  context.clip()
  NSGraphicsContext.saveGraphicsState()
  let imageContext = NSGraphicsContext(cgContext: context, flipped: true)
  NSGraphicsContext.current = imageContext
  imageContext.cgContext.setAlpha(fade)
  image.draw(in: cardRect)
  NSGraphicsContext.restoreGraphicsState()
  context.restoreGState()

  context.saveGState()
  context.setStrokeColor(NSColor.white.withAlphaComponent(0.16 * fade).cgColor)
  context.setLineWidth(1)
  context.addPath(roundedPath(cardRect, radius: 23))
  context.strokePath()
  context.restoreGState()

  let footerY = min(cardRect.maxY + 78, CGFloat(height) - 85)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: true)
  drawText("CAREEROS / PROOF-FIRST", in: CGRect(x: margin, y: footerY, width: 380, height: 24), font: labelFont, color: NSColor(white: 0.64, alpha: 1), alpha: fade)
  drawText("proof-first job search", in: CGRect(x: CGFloat(width) - 365, y: footerY, width: 305, height: 24), font: labelFont, color: NSColor(white: 0.64, alpha: 1), alignment: .right, alpha: fade)
  NSGraphicsContext.restoreGraphicsState()
}

let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let videoSettings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: width,
  AVVideoHeightKey: height,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: 7_000_000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
  ]
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
input.expectsMediaDataInRealTime = false
let pixelAttributes: [String: Any] = [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
  kCVPixelBufferWidthKey as String: width,
  kCVPixelBufferHeightKey as String: height,
  kCVPixelBufferCGImageCompatibilityKey as String: true,
  kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
]
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: pixelAttributes)
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let totalDuration = sceneDuration * Double(scenes.count)
let totalFrames = Int(totalDuration * Double(frameRate))
for frame in 0..<totalFrames {
  while !input.isReadyForMoreMediaData {
    RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.002))
  }
  let time = Double(frame) / Double(frameRate)
  let sceneIndex = min(Int(time / sceneDuration), scenes.count - 1)
  let sceneTime = time - Double(sceneIndex) * sceneDuration
  let progress = CGFloat(sceneTime / sceneDuration)

  var pixelBuffer: CVPixelBuffer?
  guard CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pixelBuffer) == kCVReturnSuccess, let buffer = pixelBuffer else {
    fatalError("Unable to allocate video frame")
  }
  CVPixelBufferLockBaseAddress(buffer, [])
  defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
  let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)
  guard let data = CVPixelBufferGetBaseAddress(buffer), let context = CGContext(
    data: data,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
  ) else {
    fatalError("Unable to draw video frame")
  }

  context.setFillColor(NSColor(red: 0.045, green: 0.055, blue: 0.08, alpha: 1).cgColor)
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  context.translateBy(x: 0, y: CGFloat(height))
  context.scaleBy(x: 1, y: -1)

  if sceneTime > sceneDuration - transitionDuration && sceneIndex < scenes.count - 1 {
    let mix = CGFloat((sceneTime - (sceneDuration - transitionDuration)) / transitionDuration)
    drawScene(scenes[sceneIndex], progress: progress, alpha: 1 - mix, context: context)
    drawScene(scenes[sceneIndex + 1], progress: 0, alpha: mix, context: context)
  } else {
    drawScene(scenes[sceneIndex], progress: progress, alpha: 1, context: context)
  }
  let presentationTime = CMTime(value: CMTimeValue(frame), timescale: CMTimeScale(frameRate))
  guard adaptor.append(buffer, withPresentationTime: presentationTime) else {
    fatalError("Unable to append video frame")
  }
}

input.markAsFinished()
let completion = DispatchSemaphore(value: 0)
writer.finishWriting { completion.signal() }
completion.wait()
guard writer.status == .completed else {
  let exportError = writer.error?.localizedDescription ?? "unknown error"
  fatalError("Video export failed: \(exportError)")
}
print(outputURL.path)
