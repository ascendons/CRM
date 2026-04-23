package com.ultron.backend.dto.request;

import com.ultron.backend.domain.entity.WebForm;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateWebFormRequest {

    @NotBlank(message = "Form name is required")
    private String name;

    private List<WebForm.FormField> fields;
    private WebForm.SubmitAction submitAction;
    private String redirectUrl;
    private String thankYouMessage;
    private String themeColor;
}
