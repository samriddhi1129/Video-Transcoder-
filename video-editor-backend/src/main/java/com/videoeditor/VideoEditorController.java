package com.videoeditor;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
// import java.io.File;
// import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
public class VideoEditorController {

    @Autowired
    private FFmpegService ffmpegService;

    @GetMapping("/api/editor/status")
    public String editorStatus() {
        return "Video Editor API is working!";
    }

    @GetMapping("/api/editor/ffmpeg")
    public String testFFmpeg() {
        return ffmpegService.getFFmpegVersion();
    }
    @PostMapping("/api/editor/trim")
public String trimVideo(
        @RequestParam("video") MultipartFile video,
        @RequestParam("startTime") double startTime,
        @RequestParam("endTime") double endTime) {

    if (video.isEmpty()) {
        return "Error: Please upload a video.";
    }

    if (startTime < 0 || endTime <= startTime) {
        return "Error: Invalid start or end time.";
    }

    try {
        Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");
        Files.createDirectories(uploadDir);

        String originalName = video.getOriginalFilename();
        String extension = ".mp4";

        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(
                originalName.lastIndexOf(".")
            ).replaceAll("[^a-zA-Z0-9.]", "");
        }

        Path inputPath = Files.createTempFile(
            uploadDir, "input-", extension
        );

        Path outputPath = Files.createTempFile(
            uploadDir, "trimmed-", ".mp4"
        );

        video.transferTo(inputPath.toFile());

        String result = ffmpegService.trimVideo(
            inputPath.toAbsolutePath().toString(),
            outputPath.toAbsolutePath().toString(),
            startTime,
            endTime - startTime
        );

        if (!result.startsWith("Video trimmed successfully:")) {
            Files.deleteIfExists(inputPath);
            Files.deleteIfExists(outputPath);
            return result;
        }

        Files.deleteIfExists(inputPath);

        return result;

    } catch (Exception e) {
        return "Error while trimming video: " + e.getMessage();
    }
}
@GetMapping("/api/editor/preview/{filename}")
public ResponseEntity<Resource> previewVideo(
        @PathVariable String filename) {

    try {
        // Only allow a simple MP4 filename
        if (!filename.matches("[a-zA-Z0-9._-]+")
                || !filename.endsWith(".mp4")) {
            return ResponseEntity.badRequest().build();
        }

        Path uploadDir = Paths.get(
            System.getProperty("user.dir"), "uploads"
        ).toAbsolutePath().normalize();

        Path videoPath = uploadDir.resolve(filename).normalize();

        if (!videoPath.startsWith(uploadDir)
                || !Files.isRegularFile(videoPath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(videoPath.toUri());

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("video/mp4"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
            .body(resource);

    } catch (Exception e) {
        return ResponseEntity.status(
            HttpStatus.INTERNAL_SERVER_ERROR
        ).build();
    }
}

@PostMapping("/api/editor/crop")
public ResponseEntity<String> cropVideo(
        @RequestParam("video") MultipartFile video,
        @RequestParam("width") int width,
        @RequestParam("height") int height,
        @RequestParam("x") int x,
        @RequestParam("y") int y) {

    if (video == null || video.isEmpty()) {
        return ResponseEntity.badRequest()
                .body("Please upload a video.");
    }

    if (width <= 0 || height <= 0 || x < 0 || y < 0) {
        return ResponseEntity.badRequest()
                .body("Invalid crop dimensions or position.");
    }

    Path inputPath = null;
    Path outputPath = null;

    try {
        Path uploadDir = Paths.get(
                System.getProperty("user.dir"), "uploads"
        ).toAbsolutePath().normalize();

        Files.createDirectories(uploadDir);

        String inputName = UUID.randomUUID() + ".mp4";
        String outputName = "cropped-" + UUID.randomUUID() + ".mp4";

        inputPath = uploadDir.resolve(inputName);
        outputPath = uploadDir.resolve(outputName);

        video.transferTo(inputPath);

        String result = ffmpegService.cropVideo(
                inputPath.toString(),
                outputPath.toString(),
                width,
                height,
                x,
                y
        );

        if (!result.startsWith("Video cropped successfully:")) {
            Files.deleteIfExists(outputPath);
            return ResponseEntity.internalServerError().body(result);
        }

        return ResponseEntity.ok(result);

    } catch (Exception e) {
        try {
            if (outputPath != null) {
                Files.deleteIfExists(outputPath);
            }
        } catch (Exception ignored) {
            // Keep the original error.
        }

        return ResponseEntity.internalServerError()
                .body("Crop failed: " + e.getMessage());

    } finally {
        try {
            if (inputPath != null) {
                Files.deleteIfExists(inputPath);
            }
        } catch (Exception ignored) {
            // Temporary input cleanup.
        }
    }
}
@PostMapping("/api/editor/rotate")
public ResponseEntity<String> rotateVideo(
        @RequestParam("video") MultipartFile video,
        @RequestParam("rotation") int rotation,
        @RequestParam(value = "flipHorizontal", defaultValue = "false") boolean flipHorizontal,
        @RequestParam(value = "flipVertical", defaultValue = "false") boolean flipVertical) {

    if (video == null || video.isEmpty()) {
        return ResponseEntity.badRequest().body("Please upload a video.");
    }

    if (rotation != 0 && rotation != 90 &&
            rotation != 180 && rotation != 270) {
        return ResponseEntity.badRequest()
                .body("Rotation must be 0, 90, 180, or 270.");
    }

    Path inputPath = null;
    Path outputPath = null;

    try {
        Path uploadDir = Paths.get(
                System.getProperty("user.dir"), "uploads"
        ).toAbsolutePath().normalize();

        Files.createDirectories(uploadDir);

        inputPath = uploadDir.resolve(UUID.randomUUID() + ".mp4");
        String outputName = "rotated-" + UUID.randomUUID() + ".mp4";
        outputPath = uploadDir.resolve(outputName);

        video.transferTo(inputPath);

        String result = ffmpegService.rotateVideo(
                inputPath.toString(),
                outputPath.toString(),
                rotation,
                flipHorizontal,
                flipVertical
        );

        if (!result.startsWith("Video rotated successfully:")) {
            Files.deleteIfExists(outputPath);
            return ResponseEntity.internalServerError().body(result);
        }

        return ResponseEntity.ok(result);

    } catch (Exception e) {
        try {
            if (outputPath != null) {
                Files.deleteIfExists(outputPath);
            }
        } catch (Exception ignored) {
            // Keep the original error.
        }

        return ResponseEntity.internalServerError()
                .body("Rotation failed: " + e.getMessage());

    } finally {
        try {
            if (inputPath != null) {
                Files.deleteIfExists(inputPath);
            }
        } catch (Exception ignored) {
            // Temporary input cleanup.
        }
    }
}
@PostMapping("/api/editor/speed")
public ResponseEntity<String> changeSpeed(
        @RequestParam("video") MultipartFile video,
        @RequestParam("speed") double speed) {

    if (video == null || video.isEmpty()) {
        return ResponseEntity.badRequest()
                .body("Please upload a video.");
    }

    if (speed != 0.5 && speed != 1.0
            && speed != 1.5 && speed != 2.0) {
        return ResponseEntity.badRequest()
                .body("Speed must be 0.5, 1.0, 1.5 or 2.0.");
    }

    Path uploadDir = Paths.get(
            System.getProperty("user.dir"), "uploads");

    Path inputPath = null;
    Path outputPath = null;

    try {
        Files.createDirectories(uploadDir);

        String id = UUID.randomUUID().toString();

        inputPath = Files.createTempFile(
                uploadDir, "speed-input-", ".mp4");

        outputPath = uploadDir.resolve(
                "speed-" + id + ".mp4");

        video.transferTo(inputPath);

        String result = ffmpegService.changeVideoSpeed(
                inputPath.toString(),
                outputPath.toString(),
                speed);

        if (!result.startsWith(
                "Video speed changed successfully:")) {
            Files.deleteIfExists(outputPath);
            return ResponseEntity.internalServerError()
                    .body(result);
        }

        return ResponseEntity.ok(
                "Video speed changed successfully: speed-"
                        + id + ".mp4");

    } catch (Exception e) {
        try {
            if (outputPath != null) {
                Files.deleteIfExists(outputPath);
            }
        } catch (Exception ignored) {
        }

        return ResponseEntity.internalServerError()
                .body("Could not change video speed: "
                        + e.getMessage());

    } finally {
        try {
            if (inputPath != null) {
                Files.deleteIfExists(inputPath);
            }
        } catch (Exception ignored) {
        }
    }
}
@PostMapping("/api/editor/merge")
public ResponseEntity<String> mergeVideos(
        @RequestParam("videos") MultipartFile[] videos) {

    if (videos == null || videos.length < 2) {
        return ResponseEntity.badRequest()
                .body("Please upload at least two videos.");
    }

    Path uploadDir = Paths.get(
            System.getProperty("user.dir"), "uploads"
    ).toAbsolutePath().normalize();

    java.util.List<Path> inputPaths = new java.util.ArrayList<>();
    Path outputPath = null;

    try {
        Files.createDirectories(uploadDir);

        for (MultipartFile video : videos) {
            if (video == null || video.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("One of the uploaded videos is empty.");
            }

            Path inputPath = uploadDir.resolve(
                    "merge-input-" + UUID.randomUUID() + ".mp4"
            );

            video.transferTo(inputPath);
            inputPaths.add(inputPath);
        }

        String outputName = "merged-" + UUID.randomUUID() + ".mp4";
        outputPath = uploadDir.resolve(outputName);

        java.util.List<String> inputStrings = inputPaths.stream()
                .map(Path::toString)
                .toList();

        String result = ffmpegService.mergeVideos(
                inputStrings,
                outputPath.toString()
        );

        if (!result.startsWith("Videos merged successfully:")) {
            Files.deleteIfExists(outputPath);
            return ResponseEntity.internalServerError().body(result);
        }

        return ResponseEntity.ok(
                "Videos merged successfully: " + outputName
        );

    } catch (Exception e) {
        try {
            if (outputPath != null) {
                Files.deleteIfExists(outputPath);
            }
        } catch (Exception ignored) {
        }

        return ResponseEntity.internalServerError()
                .body("Merge failed: " + e.getMessage());

    } finally {
        for (Path inputPath : inputPaths) {
            try {
                Files.deleteIfExists(inputPath);
            } catch (Exception ignored) {
            }
        }
    }
}
@PostMapping("/api/editor/split")
public ResponseEntity<String> splitVideo(
        @RequestParam("video") MultipartFile video,
        @RequestParam("startTime") double startTime,
        @RequestParam("endTime") double endTime) {

    if (video == null || video.isEmpty()) {
        return ResponseEntity.badRequest()
                .body("Please upload a video first.");
    }

    if (startTime < 0 || endTime <= startTime) {
        return ResponseEntity.badRequest()
                .body("Please provide valid start and end times.");
    }

    Path uploadDir = Paths.get(
            System.getProperty("user.dir"), "uploads"
    ).toAbsolutePath().normalize();

    Path inputPath = null;
    Path outputPath = null;

    try {
        Files.createDirectories(uploadDir);

        String inputName = "split-input-" + UUID.randomUUID() + ".mp4";
        String outputName = "split-" + UUID.randomUUID() + ".mp4";

        inputPath = uploadDir.resolve(inputName);
        outputPath = uploadDir.resolve(outputName);

        video.transferTo(inputPath);

        String result = ffmpegService.splitVideo(
                inputPath.toString(),
                outputPath.toString(),
                startTime,
                endTime - startTime
        );

        if (!result.startsWith("Video split successfully:")) {
            Files.deleteIfExists(outputPath);
            return ResponseEntity.internalServerError().body(result);
        }

        return ResponseEntity.ok(
                "Video split successfully: " + outputName
        );

    } catch (Exception e) {
        try {
            if (outputPath != null) {
                Files.deleteIfExists(outputPath);
            }
        } catch (Exception ignored) {
        }

        return ResponseEntity.internalServerError()
                .body("Split failed: " + e.getMessage());

    } finally {
        try {
            if (inputPath != null) {
                Files.deleteIfExists(inputPath);
            }
        } catch (Exception ignored) {
        }
    }
}
}