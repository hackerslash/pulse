package dev.hackerslash.pulse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private static final String KEY = "granularity";

    record SettingsForm(@Pattern(regexp = "day|week|month", message = "must be day, week or month") String granularity) {}

    private final SettingRepo settings;

    SettingsController(SettingRepo settings) {
        this.settings = settings;
    }

    PublicController.Granularity granularity() {
        return settings.findById(KEY).map(s -> PublicController.Granularity.valueOf(s.val.toUpperCase())).orElse(PublicController.Granularity.DAY);
    }

    @GetMapping
    SettingsForm get() {
        return new SettingsForm(granularity().name().toLowerCase());
    }

    @PutMapping
    SettingsForm put(@Valid @RequestBody SettingsForm f) {
        settings.save(new Setting(KEY, f.granularity()));
        return f;
    }
}
