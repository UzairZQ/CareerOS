import AppKit
import AVFoundation

let directory = URL(fileURLWithPath: "/Users/uzair99/Development/CareerOS/artifacts/linkedin-video-2026-07-18")
let input = directory.appendingPathComponent("careeros-linkedin-demo.mp4")
let asset = AVURLAsset(url: input)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true

for (index, seconds) in [1.0, 10.0, 19.0, 26.0].enumerated() {
  let time = CMTime(seconds: seconds, preferredTimescale: 600)
  let image = try generator.copyCGImage(at: time, actualTime: nil)
  let representation = NSBitmapImageRep(cgImage: image)
  guard let data = representation.representation(using: .png, properties: [:]) else {
    fatalError("Unable to encode preview frame")
  }
  try data.write(to: directory.appendingPathComponent(String(format: "preview-%02d.png", index + 1)))
}

print("preview frames written")
