from app.templateconfig.config import get_config
from app.templateconfig.clustering import get_clustering
from app.utils.file_handelling import save_image, save_json, read_image


class TemplateConfigJob:
    def __init__(self, data: dict):
        '''
        data is a dictionary with the following keys:
        data:
            id: int
            name: str
            template_path: str (relative path in NFS storage)
            template_config_path: str (relative path in NFS storage)
            output_image_path: str (relative path in NFS storage)
            result_image_path: str (relative path in NFS storage)
        '''
        self.id = data['id']
        self.name = data['name']
        self.config_type = data['config_type']
        self.template_path = data['template_path']
        self.template_config_path = data['template_config_path']
        self.output_image_path = data['output_image_path']
        self.result_image_path = data['result_image_path']
        self.num_of_columns = data.get('num_of_columns',None)
        self.num_of_rows_per_column = data.get('num_of_rows_per_column',None)
        self.num_of_options_per_question = data.get('num_of_options_per_question',None)
        self.save_intermediate_results = data['save_intermediate_results']
        self.template_config = None
        self.warped_img = None
        self.result_img = None

    def configure(self):
        """
        Configure template by processing the image and saving results to NFS storage
        """
        # Get configuration using NFS-aware function
        if self.config_type == 'grid_based':
            bubble_configs, warped_img, result_img = get_config(
                self.template_path, 
                self.save_intermediate_results
            )
        if self.config_type == 'clustering_based':
            bubble_configs, warped_img, result_img = get_clustering(
                self.template_path, 
                self.num_of_columns,
                self.num_of_rows_per_column,
                self.num_of_options_per_question,
                self.save_intermediate_results
            )
        self.template_config = bubble_configs
        self.warped_img = warped_img
        self.result_img = result_img
        
        
        # Save configuration JSON to NFS storage
        save_json(
            self.template_config, 
            self.template_config_path
        )
        
        # Save warped image to NFS storage
        save_image(
            self.output_image_path, 
            warped_img
        )

        # Save result image to NFS storage
        save_image(
            self.result_image_path, 
            self.result_img
        )
        
        return self.template_config, self.warped_img, self.result_img
            

    def __str__(self):
        return f"TemplateConfigJob(id={self.id}, name={self.name})"