package com.ultron.backend.dto.performance;
import com.ultron.backend.domain.entity.Objective;
import lombok.Data;
import java.util.List;
@Data
public class CreateObjectiveRequest {
    private String title;
    private String ownerId;
    private String quarter;
    private Integer year;
    private List<Objective.KeyResult> keyResults;
}
