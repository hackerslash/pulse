package dev.hackerslash.pulse;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Setting {

    @Id
    public String name;
    public String val;

    protected Setting() {}

    Setting(String name, String val) {
        this.name = name;
        this.val = val;
    }
}
