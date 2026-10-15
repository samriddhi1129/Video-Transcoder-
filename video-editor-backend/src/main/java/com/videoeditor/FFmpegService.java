package com.videoeditor;

import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.InputStreamReader;
// import java.io.File;
// import java.io.IOException;
// import java.nio.file.Files;
// import java.nio.file.Path;
// import java.nio.file.Paths;

@Service
public class FFmpegService {

    public String getFFmpegVersion() {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg", "-version"
            );

            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );

            String firstLine = reader.readLine();

            process.waitFor();

            return firstLine;

        } catch (Exception e) {
            return "FFmpeg error: " + e.getMessage();
        }
    }
    public String trimVideo(String inputPath, String outputPath,
                        double startTime, double duration) {
    try {
        ProcessBuilder processBuilder = new ProcessBuilder(
            "ffmpeg",
            "-y",
            "-ss", String.valueOf(startTime),
            "-i", inputPath,
            "-t", String.valueOf(duration),
            "-c:v", "libx264",
            "-c:a", "aac",
            outputPath
        );

        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();

        try (java.io.BufferedReader reader =
                 new java.io.BufferedReader(
                     new java.io.InputStreamReader(
                         process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            return "Video trimmed successfully: " + outputPath;
        }

        return "Trimming failed: " + output;

    } catch (Exception e) {
        return "FFmpeg error: " + e.getMessage();
    }
}
public String splitVideo(
        String inputPath,
        String outputPath,
        double startTime,
        double duration) {

    if (startTime < 0 || duration <= 0) {
        return "Invalid split start time or duration.";
    }

    try {
        ProcessBuilder builder = new ProcessBuilder(
                "ffmpeg",
                "-y",
                "-ss", String.valueOf(startTime),
                "-i", inputPath,
                "-t", String.valueOf(duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-movflags", "+faststart",
                outputPath
        );

        builder.redirectErrorStream(true);

        Process process = builder.start();

        StringBuilder logs = new StringBuilder();

        try (var reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(
                        process.getInputStream()))) {

            String line;
            while ((line = reader.readLine()) != null) {
                logs.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            return "Video split successfully: " + outputPath;
        }

        return "Split failed: " + logs;

    } catch (Exception e) {
        return "Split error: " + e.getMessage();
    }
}

public String cropVideo(
        String inputPath,
        String outputPath,
        int width,
        int height,
        int x,
        int y)
         {

    try {
        if (width <= 0 || height <= 0 || x < 0 || y < 0) {
            return "Error: Invalid crop dimensions or position.";
        }

        ProcessBuilder builder = new ProcessBuilder(
            "ffmpeg",
            "-y",
            "-i", inputPath,
            "-vf", "crop=" + width + ":" + height + ":" + x + ":" + y,
            "-c:v", "libx264",
            "-preset", "medium",
            "-c:a", "aac",
            "-movflags", "+faststart",
            outputPath
        );

        builder.redirectErrorStream(true);

        Process process = builder.start();

        String output;
        try (java.io.BufferedReader reader =
                new java.io.BufferedReader(
                    new java.io.InputStreamReader(
                        process.getInputStream()))) {

            StringBuilder logs = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                logs.append(line).append("\n");
            }

            output = logs.toString();
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            return "Video cropped successfully: " + outputPath;
        }

        return "Error cropping video: " + output;

    } catch (Exception e) {
        return "Error cropping video: " + e.getMessage();
    }
}
public String rotateVideo(
        String inputPath,
        String outputPath,
        int rotation,
        boolean flipHorizontal,
        boolean flipVertical) {

    StringBuilder filters = new StringBuilder();

    if (rotation == 90) {
        filters.append("transpose=1");
    } else if (rotation == 180) {
        filters.append("hflip,vflip");
    } else if (rotation == 270) {
        filters.append("transpose=2");
    } else if (rotation != 0) {
        return "Invalid rotation. Use 0, 90, 180, or 270.";
    }

    if (flipHorizontal) {
        if (!filters.isEmpty()) {
            filters.append(",");
        }
        filters.append("hflip");
    }

    if (flipVertical) {
        if (!filters.isEmpty()) {
            filters.append(",");
        }
        filters.append("vflip");
    }

    try {
        java.util.List<String> command = new java.util.ArrayList<>();

        command.add("ffmpeg");
        command.add("-y");
        command.add("-i");
        command.add(inputPath);

        if (!filters.isEmpty()) {
            command.add("-vf");
            command.add(filters.toString());
        }

        command.add("-c:v");
        command.add("libx264");
        command.add("-preset");
        command.add("medium");
        command.add("-pix_fmt");
        command.add("yuv420p");
        command.add("-c:a");
        command.add("aac");
        command.add("-movflags");
        command.add("+faststart");
        command.add(outputPath);

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.redirectErrorStream(true);

        Process process = builder.start();

        String output;
        try (java.io.BufferedReader reader =
                     new java.io.BufferedReader(
                             new java.io.InputStreamReader(
                                     process.getInputStream()))) {

            StringBuilder log = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                log.append(line).append("\n");
            }

            output = log.toString();
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            return "Video rotated successfully: " + outputPath;
        }

        return "Rotation failed: " + output;

    } catch (Exception e) {
        return "Rotation failed: " + e.getMessage();
    }
}
public String changeVideoSpeed(
        String inputPath,
        String outputPath,
        double speed
) {
    if (speed != 0.5 && speed != 1.0
            && speed != 1.5 && speed != 2.0) {
        return "Invalid speed selected.";
    }

    try {
        String videoFilter = "setpts=" + (1.0 / speed) + "*PTS";
        String audioFilter = "atempo=" + speed;

        ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg",
                "-y",
                "-i", inputPath,
                "-filter:v", videoFilter,
                "-filter:a", audioFilter,
                "-c:v", "libx264",
                "-preset", "medium",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-movflags", "+faststart",
                outputPath
        );

        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();

        try (var reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(
                        process.getInputStream()))) {
            while (reader.readLine() != null) {
                // FFmpeg output is consumed here.
            }
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            return "Video speed changed successfully: " + outputPath;
        }

        return "Failed to change video speed. FFmpeg exit code: "
                + exitCode;

    } catch (Exception e) {
        return "Error changing video speed: " + e.getMessage();
    }
}
public String mergeVideos(
        java.util.List<String> inputPaths,
        String outputPath) {

    if (inputPaths == null || inputPaths.size() < 2) {
        return "Error: Please provide at least two videos.";
    }

    try {
        java.util.List<String> command =
                new java.util.ArrayList<>();

        command.add("ffmpeg");
        command.add("-y");

        for (String inputPath : inputPaths) {
            command.add("-i");
            command.add(inputPath);
        }

        StringBuilder inputs = new StringBuilder();

        for (int i = 0; i < inputPaths.size(); i++) {
            inputs.append("[")
                  .append(i)
                  .append(":v:0]")
                  .append("[")
                  .append(i)
                  .append(":a:0]");
        }

        inputs.append("concat=n=")
              .append(inputPaths.size())
              .append(":v=1:a=1[outv][outa]");

        command.add("-filter_complex");
        command.add(inputs.toString());
        command.add("-map");
        command.add("[outv]");
        command.add("-map");
        command.add("[outa]");
        command.add("-c:v");
        command.add("libx264");
        command.add("-preset");
        command.add("medium");
        command.add("-c:a");
        command.add("aac");
        command.add("-movflags");
        command.add("+faststart");
        command.add(outputPath);

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.redirectErrorStream(true);

        Process process = builder.start();

        StringBuilder logs = new StringBuilder();

        try (var reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(
                        process.getInputStream()))) {

            String line;
            while ((line = reader.readLine()) != null) {
                logs.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            return "Videos merged successfully: " + outputPath;
        }

        return "Merge failed: " + logs;

    } catch (Exception e) {
        return "Merge error: " + e.getMessage();
    }
}
}